import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/admin/students")({
  component: AdminStudents,
});

function AdminStudents() {
  const { data } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "student");
      const ids = (roles ?? []).map(r => r.user_id);
      if (!ids.length) return [];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone, company, created_at").in("id", ids);
      return profiles ?? [];
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground">All registered students.</p>
        <Card className="mt-8">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Company</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {!data?.length ? <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No students yet</TableCell></TableRow> :
                  data.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name ?? "—"}</TableCell>
                      <TableCell>{s.phone ?? "—"}</TableCell>
                      <TableCell>{s.company ?? "—"}</TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Badge>Active</Badge></TableCell>
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
