import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/requests")({
  component: AdminRequests,
});

function AdminRequests() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("service_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-requests"] }); },
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold">Service Requests</h1>
        <p className="text-muted-foreground">Inquiries submitted from the website.</p>
        <div className="mt-8 space-y-3">
          {!data?.length ? <Card><CardContent className="p-10 text-center text-muted-foreground">No requests yet</CardContent></Card> :
            data.map(r => (
              <Card key={r.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{r.name}</h3>
                        <Badge variant="outline">{r.service}</Badge>
                        {r.budget && <Badge variant="secondary">{r.budget}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{r.email} {r.phone && `· ${r.phone}`} {r.company && `· ${r.company}`}</p>
                      <p className="text-sm mt-3">{r.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["new","contacted","in_progress","closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
