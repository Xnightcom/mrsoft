import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCurrentUser, primaryRole } from "@/hooks/use-current-user";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Award, ClipboardList, TrendingUp, Users, Mail, GraduationCap, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function StatCard({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string | number }) {
  return (
    <Card className="hover:shadow-elegant transition-smooth">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow"><Icon className="h-6 w-6" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentDash({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["student-stats", userId],
    queryFn: async () => {
      const [enrolls, certs, subs] = await Promise.all([
        supabase.from("enrollments").select("id, progress").eq("student_id", userId),
        supabase.from("certificates").select("id").eq("student_id", userId),
        supabase.from("submissions").select("score").eq("student_id", userId),
      ]);
      const enrolled = enrolls.data ?? [];
      const completed = enrolled.filter(e => (e.progress ?? 0) >= 100).length;
      const scores = (subs.data ?? []).map(s => s.score).filter((s): s is number => typeof s === "number");
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { enrolled: enrolled.length, completed, certs: certs.data?.length ?? 0, avg };
    },
  });
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={BookOpen} label="Courses Enrolled" value={data?.enrolled ?? 0} />
      <StatCard icon={TrendingUp} label="Completed" value={data?.completed ?? 0} />
      <StatCard icon={ClipboardList} label="Average Score" value={`${data?.avg ?? 0}%`} />
      <StatCard icon={Award} label="Certificates" value={data?.certs ?? 0} />
    </div>
  );
}

function InstructorDash({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["instr-stats", userId],
    queryFn: async () => {
      const courses = await supabase.from("courses").select("id").eq("instructor_id", userId);
      const ids = (courses.data ?? []).map(c => c.id);
      const enrolls = ids.length ? await supabase.from("enrollments").select("id").in("course_id", ids) : { data: [] };
      return { courses: ids.length, students: enrolls.data?.length ?? 0 };
    },
  });
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={GraduationCap} label="My Courses" value={data?.courses ?? 0} />
      <StatCard icon={Users} label="Total Students" value={data?.students ?? 0} />
    </div>
  );
}

function ClientDash({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["client-stats", userId],
    queryFn: async () => {
      const reqs = await supabase.from("service_requests").select("status").eq("user_id", userId);
      const rows = reqs.data ?? [];
      return { total: rows.length, open: rows.filter(r => r.status !== "closed").length };
    },
  });
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Briefcase} label="Total Requests" value={data?.total ?? 0} />
      <StatCard icon={Mail} label="Open" value={data?.open ?? 0} />
    </div>
  );
}

function AdminDash() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [students, courses, reqs, pay] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("service_requests").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount"),
      ]);
      const revenue = (pay.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
      return { students: students.count ?? 0, courses: courses.count ?? 0, reqs: reqs.count ?? 0, revenue };
    },
  });
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Users} label="Students" value={data?.students ?? 0} />
      <StatCard icon={GraduationCap} label="Courses" value={data?.courses ?? 0} />
      <StatCard icon={Mail} label="Service Requests" value={data?.reqs ?? 0} />
      <StatCard icon={TrendingUp} label="Revenue" value={`$${(data?.revenue ?? 0).toLocaleString()}`} />
    </div>
  );
}

function DashboardPage() {
  const user = useCurrentUser();
  const role = primaryRole(user.roles);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.fullName?.split(" ")[0] ?? "there"} 👋</h1>
          <p className="text-muted-foreground capitalize">{role} dashboard</p>
        </div>
        {user.loading || !user.userId ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : role === "admin" ? <AdminDash /> :
          role === "instructor" ? <InstructorDash userId={user.userId} /> :
          role === "client" ? <ClientDash userId={user.userId} /> :
          <StudentDash userId={user.userId} />}

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6">
            <h3 className="font-semibold mb-3">Get started</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {role === "student" && <>
                <li>• Browse courses and enroll</li>
                <li>• Submit your assignments on time</li>
                <li>• Earn certificates upon completion</li>
              </>}
              {role === "admin" && <>
                <li>• Manage students and instructors</li>
                <li>• Publish new courses</li>
                <li>• Review service requests</li>
              </>}
              {role === "instructor" && <>
                <li>• Create and publish your courses</li>
                <li>• Grade student submissions</li>
              </>}
              {role === "client" && <>
                <li>• Submit a new project request</li>
                <li>• Track ongoing engagements</li>
              </>}
            </ul>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <h3 className="font-semibold mb-3">Support</h3>
            <p className="text-sm text-muted-foreground">Need help? Reach our team at <a className="text-primary" href="mailto:tambikingdavid@gmail.com">tambikingdavid@gmail.com</a>.</p>
          </CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
