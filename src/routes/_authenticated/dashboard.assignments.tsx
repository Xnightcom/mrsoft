import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const user = useCurrentUser();
  const { data } = useQuery({
    queryKey: ["assignments", user.userId],
    enabled: !!user.userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, course:courses(title)")
        .order("deadline", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">Submit your work before the deadline.</p>
        <div className="mt-8 space-y-3">
          {!data?.length ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                No assignments yet.
              </CardContent>
            </Card>
          ) : (
            data.map((a: any) => (
              <Card key={a.id} className="hover:shadow-elegant transition-smooth">
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {(a.course as { title: string } | null)?.title}
                    </div>
                    <h3 className="font-semibold mt-1">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {a.description}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    {a.deadline && (
                      <Badge variant="outline">
                        Due {new Date(a.deadline).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
