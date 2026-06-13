import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, CheckSquare, Calendar as CalendarIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/instructor/")({
  component: InstructorOverviewPage,
});

function InstructorOverviewPage() {
  const { profile } = useProfile();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["instructor-stats", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { courses: 0, students: 0, assignments: 0 };

      // Get instructor's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, class_schedule")
        .eq("instructor_id", profile.id);

      const courseIds = (courses || []).map((c) => c.id);

      // Get enrolled students
      const { count: studentsCount } = await supabase
        .from("enrollments")
        .select("id", { count: "exact" })
        .in("course_id", courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000']);

      // Get pending assignments (not graded)
      const { count: assignmentsCount } = await supabase
        .from("assignments")
        .select("id", { count: "exact" })
        .in("course_id", courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000'])
        .is("grade", null);

      return {
        courses: courseIds.length,
        students: studentsCount || 0,
        assignments: assignmentsCount || 0,
      };
    },
    enabled: !!profile?.id,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructor Overview</h1>
          <p className="text-white/50 text-sm mt-1">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Instructor"}. Here's what's happening.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] shadow-[0_0_15px_rgba(26,107,26,0.05)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-white/70">Assigned Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-[#1A6B1A]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? "-" : stats?.courses}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] shadow-[0_0_15px_rgba(26,107,26,0.05)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-white/70">Total Students</CardTitle>
              <Users className="h-4 w-4 text-[#1A6B1A]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? "-" : stats?.students}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] shadow-[0_0_15px_rgba(26,107,26,0.05)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-white/70">Pending Assignments</CardTitle>
              <CheckSquare className="h-4 w-4 text-[#CC0000]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? "-" : stats?.assignments}
              </div>
              <p className="text-xs text-[#CC0000]/70 mt-1">Needs grading</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] shadow-[0_0_15px_rgba(26,107,26,0.05)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-white/70">Next Class</CardTitle>
              <CalendarIcon className="h-4 w-4 text-[#1A6B1A]" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">
                Check Schedule
              </div>
              <p className="text-xs text-white/50 mt-1">See Courses tab</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
