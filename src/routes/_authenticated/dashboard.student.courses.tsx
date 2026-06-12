import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { Play, ArrowLeft, CheckCircle2, Lock, Unlock, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/student/courses")({
  component: StudentCoursesPage,
});

interface EnrolledCourse {
  id: string;
  progress: number;
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    level: string;
    duration_hours: number | null;
  };
}

interface Lesson {
  id: string;
  title: string;
  content_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_published: boolean;
}

function StudentCoursesPage() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null);

  // 1. Fetch Enrolled Courses
  const { data: enrolls = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["student-courses-list", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          progress,
          course:courses(id, title, description, thumbnail_url, level, duration_hours)
        `)
        .eq("student_id", profile.id);

      if (error) throw error;
      return data as unknown as EnrolledCourse[];
    },
    enabled: !!profile?.id,
  });

  // 2. Fetch Lessons for Selected Course
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["student-course-lessons", selectedCourse?.course.id],
    queryFn: async () => {
      if (!selectedCourse?.course.id) return [];
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", selectedCourse.course.id)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!selectedCourse?.course.id,
  });

  // 3. Update Progress Mutation
  const updateProgress = useMutation({
    mutationFn: async ({ enrollmentId, progress }: { enrollmentId: string; progress: number }) => {
      const { error } = await supabase
        .from("enrollments")
        .update({
          progress,
          completed_at: progress >= 100 ? new Date().toISOString() : null,
        })
        .eq("id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-courses-list"] });
      qc.invalidateQueries({ queryKey: ["student-enrollments"] });
      // Update local state to show updated progress immediately
      if (selectedCourse) {
        setSelectedCourse((prev) => {
          if (!prev) return null;
          // Calculate new progress in state to sync rendering immediately
          return prev;
        });
      }
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const handleLessonCheck = (lessonIdx: number) => {
    if (!selectedCourse) return;
    const totalLessons = lessons.length;
    if (totalLessons === 0) return;

    // Calculate new progress percent
    const nextCompletedCount = lessonIdx + 1;
    const nextProgress = Math.round((nextCompletedCount / totalLessons) * 100);

    updateProgress.mutate({
      enrollmentId: selectedCourse.id,
      progress: nextProgress,
    });
    
    // Optimistic progress update in view
    setSelectedCourse({
      ...selectedCourse,
      progress: nextProgress
    });

    toast.success("Progress saved! Great job.");
  };

  const activeEnrollment = enrolls.find(e => e.course.id === selectedCourse?.course.id);
  const currentProgress = activeEnrollment ? activeEnrollment.progress : (selectedCourse?.progress ?? 0);
  const totalLessons = lessons.length;
  const completedCount = totalLessons > 0 ? Math.round((currentProgress / 100) * totalLessons) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {selectedCourse ? (
          /* Lesson List view */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedCourse(null)}
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Courses
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(26,107,26,0.2)] pb-4">
              <div>
                <span className="text-xs font-bold text-[#CC0000] uppercase tracking-wider">
                  Course syllabus
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedCourse.course.title}</h2>
                <p className="text-xs text-white/50 mt-1">{selectedCourse.course.description}</p>
              </div>
              <div className="w-full md:w-64 bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-4">
                <ProgressBar value={currentProgress} color="green" showLabel={true} />
              </div>
            </div>

            {/* Syllabus lessons */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white tracking-wide">Lessons</h3>
              {lessonsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : totalLessons === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
                  No lessons published for this course yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lessons.map((lesson, idx) => {
                    const isCompleted = idx < completedCount;
                    const isUnlocked = idx === completedCount;
                    const isLocked = idx > completedCount;

                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          isCompleted
                            ? "bg-[#1A6B1A]/5 border-[#1A6B1A]/20"
                            : isUnlocked
                            ? "bg-[#CC0000]/5 border-[#CC0000]/25 shadow-[0_0_10px_rgba(204,0,0,0.05)]"
                            : "bg-[#0F0F0F] border-white/5 opacity-50 select-none"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-[#22c55e] shrink-0" />
                          ) : isUnlocked ? (
                            <Unlock className="h-5 w-5 text-yellow-500 shrink-0 animate-pulse" />
                          ) : (
                            <Lock className="h-5 w-5 text-white/30 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-white truncate">
                              {idx + 1}. {lesson.title}
                            </p>
                            {lesson.duration_minutes && (
                              <p className="text-[10px] text-white/40 mt-0.5">
                                {lesson.duration_minutes} minutes
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Lesson URL if unlocked/completed */}
                          {!isLocked && lesson.content_url && (
                            <a
                              href={lesson.content_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1.5 p-1"
                            >
                              Open Content
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}

                          {/* Checkbox for unlocked */}
                          {isUnlocked && (
                            <Button
                              size="sm"
                              className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white font-bold text-[10px] px-2.5 py-1"
                              onClick={() => handleLessonCheck(idx)}
                            >
                              Complete Lesson
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Grid of Enrolled Course Cards */
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
              <p className="text-white/50 text-sm mt-1">
                View your active learning programs and track your curriculum path.
              </p>
            </div>

            {coursesLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-80 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : enrolls.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/50 text-sm">
                You are not enrolled in any courses yet. Contact an administrator to register.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {enrolls.map((en: any) => (
                  <div
                    key={en.id}
                    className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] hover:border-[#CC0000]/50 rounded-xl overflow-hidden shadow-md flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_15px_rgba(204,0,0,0.15)]"
                  >
                    <div>
                      {/* Thumbnail */}
                      <div className="h-40 w-full relative">
                        <img
                          src={en.course.thumbnail_url}
                          alt={en.course.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white uppercase tracking-wider">
                          {en.course.level}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <h4 className="font-bold text-white text-base line-clamp-1">
                          {en.course.title}
                        </h4>
                        <ProgressBar value={en.progress} color="green" showLabel={true} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-[#0A0A0A] border-t border-white/5 flex justify-end">
                      <Button
                        size="sm"
                        className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center gap-1.5"
                        onClick={() => setSelectedCourse(en)}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Continue Learning
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
