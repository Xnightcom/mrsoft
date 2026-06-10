import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/courses")({
  component: AdminCourses,
});

function AdminCourses() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "0", duration_hours: "0", is_published: true });

  const { data } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
      const { error } = await supabase.from("courses").insert({
        title: form.title, slug, description: form.description, category: form.category,
        price: Number(form.price), duration_hours: Number(form.duration_hours),
        is_published: form.is_published, instructor_id: user.userId,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course created"); setOpen(false); setForm({ title: "", description: "", category: "", price: "0", duration_hours: "0", is_published: true }); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("courses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Courses</h1>
            <p className="text-muted-foreground">Create, edit, and publish courses.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="hero"><Plus className="h-4 w-4" /> New course</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create course</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
                <div><Label>Title</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                  <div><Label>Duration (hrs)</Label><Input type="number" value={form.duration_hours} onChange={e => setForm({ ...form, duration_hours: e.target.value })} /></div>
                </div>
                <div><Label>Price (Naira)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm({ ...form, is_published: v })} /><Label>Publish immediately</Label></div>
                <Button type="submit" variant="hero" className="w-full" disabled={create.isPending}>{create.isPending ? "Creating..." : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {!data?.length ? <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No courses yet. Create one above.</TableCell></TableRow> :
                  data.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{c.category ?? "—"}</TableCell>
                      <TableCell>${c.price}</TableCell>
                      <TableCell><Badge variant={c.is_published ? "default" : "outline"}>{c.is_published ? "Published" : "Draft"}</Badge></TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
