import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const user = useCurrentUser();
  const [form, setForm] = useState({ full_name: "", phone: "", company: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user.userId) return;
    supabase.from("profiles").select("*").eq("id", user.userId).maybeSingle().then(({ data }) => {
      if (data) setForm({ full_name: data.full_name ?? "", phone: data.phone ?? "", company: data.company ?? "" });
    });
  }, [user.userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.userId, ...form, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-2xl">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account details.</p>
        <Card className="mt-8">
          <CardContent className="p-8">
            <form onSubmit={save} className="space-y-4">
              <div><Label>Email</Label><Input value={user.email ?? ""} disabled /></div>
              <div><Label>Full name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Company</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              <Button type="submit" variant="hero" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
