import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ClipboardList, Calendar, Play } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/dashboard/student/")({
  component: StudentMyLearning,
});

interface EnrolledCourse {
  id: string;
  progress: number;
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
  };
}

interface Assignment {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  course: {
    title: string;
  } | null;
}

function StudentMyLearning() {
  const { profile } = useProfile();

  // Query enrollments
  const { data: enrolls = [], isLoading: enrollsLoading } = useQuery({
    queryKey: ["student-enrollments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          progress,
          course:courses(id, title, description, thumbnail_url)
        `)
        .eq("student_id", profile.id);

      if (error) throw error;
      return data as unknown as EnrolledCourse[];
    },
    enabled: !!profile?.id,
  });

  // Query assignments
  const { data: assignments = [], isLoading: assLoading } = useQuery({
    queryKey: ["student-assignments-due", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          due_date,
          status,
          course_id
        `)
        .eq("student_id", profile.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      // Fetch course titles manually for the assignments
      const courseIds = data.map(a => a.course_id).filter(Boolean);
      let coursesMap: Record<string, string> = {};
      if (courseIds.length > 0) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);
        if (courseData) {
          courseData.forEach(c => {
            coursesMap[c.id] = c.title;
          });
        }
      }

      return data.map(a => ({
        ...a,
        course: a.course_id ? { title: coursesMap[a.course_id] || "Course" } : null
      })) as unknown as Assignment[];
    },
    enabled: !!profile?.id,
  });

  // Query attendance rate
  const { data: attendanceRate = 100, isLoading: attLoading } = useQuery({
    queryKey: ["student-attendance-stats", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 100;
      const { data, error } = await supabase
        .from("attendance")
        .select("attended")
        .eq("student_id", profile.id);

      if (error) throw error;
      if (!data.length) return 100;

      const attended = data.filter((a) => a.attended).length;
      return Math.round((attended / data.length) * 100);
    },
    enabled: !!profile?.id,
  });

  const activeCourse = enrolls.find((e) => e.progress < 100) || enrolls[0];
  const assignmentsDueCount = assignments.length;

  const loading = enrollsLoading || assLoading || attLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Learning Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">Welcome back! Check your progress and tasks.</p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Courses Enrolled"
                value={enrolls.length}
                icon={BookOpen}
                color="blue"
              />
              <StatCard
                title="Assignments Due"
                value={assignmentsDueCount}
                icon={ClipboardList}
                color="yellow"
              />
              <StatCard
                title="Attendance Rate"
                value={`${attendanceRate}%`}
                icon={Calendar}
                color="green"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Continue Learning card */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-bold text-white tracking-wide">Continue Learning</h3>
                {activeCourse ? (
                  <div className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] hover:border-[#CC0000]/50 rounded-xl overflow-hidden shadow-md p-6 flex flex-col md:flex-row justify-between gap-6 transition-all duration-300 hover:shadow-[0_0_15px_rgba(204,0,0,0.1)]">
                    <div className="space-y-3 flex-1">
                      <div>
                        <span className="text-xs text-[#CC0000] font-bold tracking-wider uppercase">
                          Enrolled Course
                        </span>
                        <h4 className="text-xl font-bold text-white mt-1">{activeCourse.course.title}</h4>
                        <p className="text-xs text-white/50 mt-1 line-clamp-2">
                          {activeCourse.course.description}
                        </p>
                      </div>
                      <div className="pt-2 max-w-sm">
                        <ProgressBar value={activeCourse.progress} color="green" showLabel={true} />
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0">
                      <Link to="/dashboard/student/courses">
                        <Button className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Continue Course
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-white/50 text-sm">
                    You aren't currently enrolled in any active courses.
                  </div>
                )}
              </div>

              {/* Upcoming deadlines */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white tracking-wide">Upcoming Deadlines</h3>
                <div className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-4 space-y-3">
                  {assignments.length === 0 ? (
                    <p className="text-xs text-white/40 py-4 text-center">No assignments due!</p>
                  ) : (
                    assignments.map((ass) => (
                      <div
                        key={ass.id}
                        className="p-3 bg-[#060606] border border-white/5 rounded-lg space-y-1.5"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-semibold text-white truncate">{ass.title}</span>
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-bold uppercase">
                            Pending
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 truncate">
                          Course: {ass.course?.title ?? "Core Course"}
                        </p>
                        {ass.due_date && (
                          <p className="text-[10px] text-[#CC0000] font-semibold">
                            Due: {new Date(ass.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
