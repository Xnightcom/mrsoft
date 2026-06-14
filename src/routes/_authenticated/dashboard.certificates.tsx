import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/certificates")({
  component: CertificatesPage,
});

function CertificatesPage() {
  const user = useCurrentUser();
  const { data } = useQuery({
    queryKey: ["certs", user.userId],
    enabled: !!user.userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates")
        .select("id, issued_at, course:courses(title)")
        .eq("student_id", user.userId!);
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold">Certificates</h1>
        <p className="text-muted-foreground">Earned upon completing a course.</p>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!data?.length ? (
            <Card className="md:col-span-3"><CardContent className="p-10 text-center text-muted-foreground">No certificates yet. Complete a course to earn one.</CardContent></Card>
          ) : data.map((c: any) => (
            <Card key={c.id} className="hover:shadow-elegant transition-smooth overflow-hidden">
              <div className="gradient-hero p-6 text-primary-foreground">
                <Award className="h-10 w-10 mb-3" />
                <div className="text-xs uppercase tracking-wider opacity-80">Certificate of Completion</div>
                <div className="font-bold text-lg mt-1">{(c.course as { title: string } | null)?.title ?? "Course"}</div>
              </div>
              <CardContent className="p-6 text-sm">
                <div className="text-muted-foreground">Issued</div>
                <div className="font-medium">{new Date(c.issued_at).toLocaleDateString()}</div>
                <div className="text-muted-foreground mt-3">Certificate ID</div>
                <div className="font-mono text-xs">{c.id}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
