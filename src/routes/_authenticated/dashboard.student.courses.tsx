import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { Play, ArrowLeft, CheckCircle2, Lock, Unlock, ExternalLink, FileText, Download, Upload, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/student/courses")({
  component: StudentCoursesPage,
});

interface EnrolledCourse {
  id: string;
  progress_percent: number;
  instructor_notes: string | null;
  course: {
    id: string;
    title: string;
    description: string | null;
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

  // Assignment submissions
  const [submissionTexts, setSubmissionTexts] = useState<Record<string, string>>({});

  // 1. Fetch Enrolled Courses
  const { data: enrolls = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["student-courses-list", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          progress_percent,
          instructor_notes,
          course:courses(id, title, description, level, duration_hours)
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

  const { data: books = [] } = useQuery({
    queryKey: ["student-course-books", selectedCourse?.course.id],
    queryFn: async () => {
      if (!selectedCourse?.course.id) return [];
      const { data, error } = await supabase
        .from("course_books")
        .select("*")
        .eq("course_id", selectedCourse.course.id)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse?.course.id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["student-assignments", selectedCourse?.course.id, profile?.id],
    queryFn: async () => {
      if (!selectedCourse?.course.id || !profile?.id) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("course_id", selectedCourse.course.id)
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse?.course.id && !!profile?.id,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["student-attendance", selectedCourse?.course.id, profile?.id],
    queryFn: async () => {
      if (!selectedCourse?.course.id || !profile?.id) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("course_id", selectedCourse.course.id)
        .eq("student_id", profile.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse?.course.id && !!profile?.id,
  });

  const submitAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const text = submissionTexts[assignmentId];
      if (!text || !text.trim()) throw new Error("Submission cannot be empty");
      const { error } = await supabase
        .from("assignments")
        .update({ submission_text: text })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully");
      qc.invalidateQueries({ queryKey: ["student-assignments"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const activeEnrollment = enrolls.find(e => e.course.id === selectedCourse?.course.id);
  const currentProgress = activeEnrollment ? activeEnrollment.progress_percent : 0;
  const totalLessons = lessons.length;
  const completedCount = totalLessons > 0 ? Math.floor((currentProgress / 100) * totalLessons) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {selectedCourse ? (
          /* Course Details view */
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
                  Course
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedCourse.course.title}</h2>
                <p className="text-xs text-white/50 mt-1">{selectedCourse.course.description}</p>
                {activeEnrollment?.instructor_notes && (
                  <div className="mt-2 text-xs bg-[#1A6B1A]/10 border border-[#1A6B1A]/20 p-2 rounded text-green-400">
                    <strong className="text-white">Instructor Notes:</strong> {activeEnrollment.instructor_notes}
                  </div>
                )}
              </div>
              <div className="w-full md:w-64 bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-4">
                <ProgressBar value={currentProgress} color="green" showLabel={true} />
                <p className="text-[10px] text-white/40 mt-1 text-center italic">Progress updated by instructor</p>
              </div>
            </div>

            <Tabs defaultValue="syllabus" className="mt-4">
              <TabsList className="bg-white/5 border border-white/10 grid grid-cols-4 w-full h-10">
                <TabsTrigger value="syllabus" className="data-[state=active]:bg-[#CC0000] text-xs">Syllabus</TabsTrigger>
                <TabsTrigger value="books" className="data-[state=active]:bg-[#CC0000] text-xs">Books</TabsTrigger>
                <TabsTrigger value="attendance" className="data-[state=active]:bg-[#CC0000] text-xs">Attendance</TabsTrigger>
                <TabsTrigger value="assignments" className="data-[state=active]:bg-[#CC0000] text-xs">Assignments</TabsTrigger>
              </TabsList>

              <TabsContent value="syllabus" className="mt-4 space-y-3">
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
                      const isUnlocked = idx === completedCount || currentProgress === 100;
                      const isLocked = !isCompleted && !isUnlocked;

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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="books" className="mt-4">
                <div className="space-y-3">
                  {books.length === 0 ? (
                    <p className="text-white/50 text-center py-8">No course books available.</p>
                  ) : (
                    books.map((book: any) => (
                      <div key={book.id} className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-[#CC0000]/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-[#CC0000]" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm">{book.title}</h4>
                            <p className="text-xs text-white/50">{book.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 hover:bg-white/10 text-white"
                          onClick={async () => {
                            const { data } = await supabase.storage.from("course-books").createSignedUrl(book.pdf_url, 3600);
                            if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                            else toast.error("Could not generate download link");
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" /> Read PDF
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="mt-4">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-4 text-sm">Your Attendance Records</h3>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {attendance.length === 0 ? (
                      <p className="text-white/50 text-xs text-center py-4">No attendance records found.</p>
                    ) : (
                      attendance.map((rec: any) => (
                        <div key={rec.id} className="flex justify-between items-center text-xs p-3 bg-white/5 rounded border border-white/5">
                          <span className="text-white/70 font-medium">{new Date(rec.date).toLocaleDateString()}</span>
                          <span className={`capitalize font-bold px-2 py-0.5 rounded ${rec.status === 'present' ? 'bg-green-500/10 text-green-500' : rec.status === 'late' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                            {rec.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="mt-4">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {assignments.length === 0 ? (
                    <p className="text-white/50 text-center py-8">No assignments for this course.</p>
                  ) : (
                    assignments.map((assn: any) => (
                      <div key={assn.id} className="p-4 bg-[#0A0A0A] rounded-lg border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-white">{assn.title}</h4>
                            <p className="text-[10px] text-white/50 mt-1">{assn.description}</p>
                            {assn.due_date && <p className="text-[10px] text-red-400 mt-1">Due: {new Date(assn.due_date).toLocaleDateString()}</p>}
                          </div>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/70 whitespace-nowrap">Max: {assn.max_grade}</span>
                        </div>
                        
                        {assn.grade !== null ? (
                          <div className="mt-4 p-3 bg-[#1A6B1A]/10 border border-[#1A6B1A]/30 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-green-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Graded</span>
                              <span className="text-sm font-bold text-white">{assn.grade} / {assn.max_grade}</span>
                            </div>
                            <p className="text-xs text-white/70 italic">"{assn.feedback}"</p>
                          </div>
                        ) : assn.submission_text ? (
                          <div className="mt-4">
                            <p className="text-[10px] text-white/50 mb-1">Your Submission:</p>
                            <div className="text-xs text-white/80 bg-white/5 p-3 rounded border border-white/5">
                              {assn.submission_text}
                            </div>
                            <p className="text-[10px] text-yellow-500 mt-2">Waiting for instructor to grade.</p>
                          </div>
                        ) : (
                          <div className="mt-4 space-y-2">
                            <Textarea 
                              placeholder="Type your submission here..." 
                              className="min-h-[100px] text-xs bg-[#060606] border-white/20 text-white"
                              value={submissionTexts[assn.id] || ""}
                              onChange={(e) => setSubmissionTexts({...submissionTexts, [assn.id]: e.target.value})}
                            />
                            <Button 
                              onClick={() => submitAssignment.mutate(assn.id)}
                              disabled={submitAssignment.isPending || !submissionTexts[assn.id]?.trim()}
                              className="w-full bg-[#CC0000] hover:bg-[#CC0000]/80 text-white text-xs h-8"
                            >
                              <Upload className="w-3 h-3 mr-2" />
                              Submit Assignment
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
                  <div key={i} className="h-60 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse" />
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
                    className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] hover:border-[#CC0000]/50 rounded-xl overflow-hidden shadow-md flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_15px_rgba(204,0,0,0.15)] course-card"
                  >
                    <div>
                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-base line-clamp-1 flex-1">
                            {en.course.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white uppercase tracking-wider ml-2 shrink-0">
                            {en.course.level}
                          </span>
                        </div>
                        <ProgressBar value={en.progress_percent} color="green" showLabel={true} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-[#0A0A0A] border-t border-white/5 flex justify-end">
                      <Button
                        size="sm"
                        className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center gap-1.5 w-full"
                        onClick={() => setSelectedCourse(en)}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Open Course
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
