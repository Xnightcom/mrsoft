import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  const user = useCurrentUser();
  const { data } = useQuery({
    queryKey: ["my-requests", user.userId],
    enabled: !!user.userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_requests").select("*").eq("user_id", user.userId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold">My Service Requests</h1>
        <p className="text-muted-foreground">Track the status of your projects.</p>
        <div className="mt-8 space-y-3">
          {!data?.length ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">No requests yet. <a className="text-primary" href="/contact">Submit one</a>.</CardContent></Card>
          ) : data.map(r => (
            <Card key={r.id}>
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{r.service}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={r.status === "closed" ? "outline" : "default"}>{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
