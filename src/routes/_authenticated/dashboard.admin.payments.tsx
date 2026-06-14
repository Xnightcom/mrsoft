import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/admin/payments")({
  component: AdminPayments,
});

function AdminPayments() {
  const { data } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const total = (data ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">All transactions across the platform.</p>
        <div className="mt-6"><Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">Total revenue</div><div className="text-3xl font-bold mt-1">${total.toLocaleString()}</div></CardContent></Card></div>
        <Card className="mt-6">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {!data?.length ? <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No payments yet</TableCell></TableRow> :
                  data.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs">{p.user_id.slice(0,8)}…</TableCell>
                      <TableCell>${p.amount}</TableCell>
                      <TableCell><Badge variant={p.status === "succeeded" ? "default" : "outline"}>{p.status}</Badge></TableCell>
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
