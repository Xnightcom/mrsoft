import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Modal } from "@/components/dashboard/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { BookOpen, Calendar, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/student/assignments")({
  component: StudentAssignmentsPage,
});

interface Assignment {
  id: string;
  course_id: string | null;
  student_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  submission_url: string | null;
  grade: number | null;
  feedback: string | null;
  status: "pending" | "submitted" | "graded";
  created_at: string;
}

function StudentAssignmentsPage() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["student-assignments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("student_id", profile.id);

      if (error) throw error;

      // Fetch course names manually
      const courseIds = data.map((a: any) => a.course_id).filter(Boolean);
      const coursesMap: Record<string, string> = {};
      if (courseIds.length > 0) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);
        if (courseData) {
          courseData.forEach((c: any) => {
            coursesMap[c.id] = c.title;
          });
        }
      }

      return data.map((a: any) => ({
        ...a,
        courseName: a.course_id ? coursesMap[a.course_id] || "Course" : "General",
      })) as unknown as (Assignment & { courseName: string })[];
    },
    enabled: !!profile?.id,
  });

  const submitAssignment = useMutation({
    mutationFn: async () => {
      if (!selectedAssignment) return;
      const { error } = await supabase
        .from("assignments")
        .update({
          submission_url: submissionUrl,
          status: "submitted",
        })
        .eq("id", selectedAssignment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      setSubmitModalOpen(false);
      setSubmissionUrl("");
      setSelectedAssignment(null);
      qc.invalidateQueries({ queryKey: ["student-assignments"] });
      qc.invalidateQueries({ queryKey: ["student-assignments-due"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const getDaysRemaining = (dueDateStr: string | null) => {
    if (!dueDateStr) return "No due date";
    const due = new Date(dueDateStr);
    const today = new Date();
    const diff = due.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    return `${days} days left`;
  };

  const pending = assignments.filter((a) => a.status === "pending");
  const submitted = assignments.filter((a) => a.status === "submitted");
  const graded = assignments.filter((a) => a.status === "graded");

  const renderCard = (a: any) => (
    <div
      key={a.id}
      className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] hover:border-[#CC0000]/50 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 hover:shadow-[0_0_15px_rgba(204,0,0,0.1)]"
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded font-medium">
            {a.courseName}
          </span>
          <StatusBadge status={a.status} />
        </div>
        <h4 className="font-bold text-white text-base truncate">{a.title}</h4>
        <p className="text-white/60 text-xs line-clamp-2">{a.description}</p>

        {a.due_date && a.status === "pending" && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#CC0000] pt-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              {getDaysRemaining(a.due_date)} ({new Date(a.due_date).toLocaleDateString()})
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2 w-full md:w-auto">
        {a.status === "pending" && (
          <Button
            size="sm"
            className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white w-full md:w-auto"
            onClick={() => {
              setSelectedAssignment(a);
              setSubmitModalOpen(true);
            }}
          >
            Submit Work
          </Button>
        )}

        {a.status === "submitted" && (
          <div className="text-right text-xs">
            <span className="text-white/40 block">Submitted link:</span>
            <a
              href={a.submission_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline break-all truncate block max-w-xs"
            >
              {a.submission_url}
            </a>
          </div>
        )}

        {a.status === "graded" && (
          <div className="bg-[#1A6B1A]/10 border border-[#1A6B1A]/30 rounded-lg p-3 text-right space-y-1.5 w-full md:w-64">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-white/50">Grade:</span>
              <span className="text-lg font-bold text-[#22c55e]">{a.grade}/100</span>
            </div>
            {a.feedback && (
              <div className="text-left text-[11px] text-white/70 border-t border-white/5 pt-1">
                <strong>Feedback:</strong> {a.feedback}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-white/50 text-sm mt-1">
            Access assigned course tasks and view scores/grading commentary.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] text-white/60 mb-6">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-[#CC0000] data-[state=active]:text-white"
              >
                Pending ({pending.length})
              </TabsTrigger>
              <TabsTrigger
                value="submitted"
                className="data-[state=active]:bg-[#CC0000] data-[state=active]:text-white"
              >
                Submitted ({submitted.length})
              </TabsTrigger>
              <TabsTrigger
                value="graded"
                className="data-[state=active]:bg-[#CC0000] data-[state=active]:text-white"
              >
                Graded ({graded.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 outline-none">
              {pending.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/40 text-xs">
                  No pending assignments.
                </div>
              ) : (
                pending.map(renderCard)
              )}
            </TabsContent>

            <TabsContent value="submitted" className="space-y-4 outline-none">
              {submitted.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/40 text-xs">
                  No submitted assignments awaiting grade.
                </div>
              ) : (
                submitted.map(renderCard)
              )}
            </TabsContent>

            <TabsContent value="graded" className="space-y-4 outline-none">
              {graded.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/40 text-xs">
                  No graded assignments.
                </div>
              ) : (
                graded.map(renderCard)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Submit Assignment Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => {
          setSubmitModalOpen(false);
          setSelectedAssignment(null);
          setSubmissionUrl("");
        }}
        title="Submit Assignment Solution"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitAssignment.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <h4 className="font-bold text-white text-sm">{selectedAssignment?.title}</h4>
            <p className="text-[11px] text-white/50 mt-1">{selectedAssignment?.description}</p>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-white/70">Submission Link / File URL</Label>
            <Input
              required
              placeholder="e.g. https://github.com/username/project-repo"
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(26,107,26,0.1)]">
            <Button
              type="button"
              variant="outline"
              className="border-[rgba(26,107,26,0.3)] text-white/70 hover:bg-white/5"
              onClick={() => {
                setSubmitModalOpen(false);
                setSelectedAssignment(null);
                setSubmissionUrl("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitAssignment.isPending || !submissionUrl.trim()}
              className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white"
            >
              {submitAssignment.isPending ? "Submitting..." : "Submit Solutions"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
