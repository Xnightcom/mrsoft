import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/courses")({
  component: CoursesPage,
});

function CoursesPage() {
  const user = useCurrentUser();
  const qc = useQueryClient();

  const { data: courses } = useQuery({
    queryKey: ["courses-published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ["my-enrollments", user.userId],
    enabled: !!user.userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", user.userId!);
      if (error) throw error;
      return data;
    },
  });

  const enroll = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("enrollments")
        .insert({ student_id: user.userId!, course_id: courseId, progress: 0 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Enrolled!");
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enrolledIds = new Set((myEnrollments ?? []).map((e: any) => e.course_id));

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Continue learning or enroll in something new.</p>
        </div>

        {(myEnrollments?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">In progress</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEnrollments!.map((e: any) => {
                const c = (courses as any[] | undefined)?.find((c: any) => c.id === e.course_id);
                if (!c) return null;
                return (
                  <Card key={e.id} className="hover:shadow-elegant transition-smooth">
                    <CardContent className="p-6">
                      <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary text-primary-foreground mb-3">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{c.category}</p>
                      <div className="mt-3">
                        <Progress value={e.progress ?? 0} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {e.progress ?? 0}% complete
                      </p>
                      <Button asChild variant="hero" size="sm" className="mt-4 w-full">
                        <Link to="/dashboard/courses">Continue</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-4">Course catalog</h2>
          {!courses?.length ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                No published courses yet. Check back soon.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c: any) => (
                <Card
                  key={c.id}
                  className="hover:shadow-elegant transition-smooth overflow-hidden course-card"
                >
                  <div className="h-28 gradient-hero" />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {c.duration_hours}h · {c.category}
                    </div>
                    <h3 className="mt-2 font-semibold">{c.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {c.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-bold">
                        {Number(c.price) > 0 ? `$${c.price}` : "Free"}
                      </span>
                      {enrolledIds.has(c.id) ? (
                        <Button size="sm" variant="outline" disabled>
                          Enrolled
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="hero"
                          onClick={() => enroll.mutate(c.id)}
                          disabled={enroll.isPending}
                        >
                          Enroll
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
