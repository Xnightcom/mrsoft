import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Modal } from "@/components/dashboard/Modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Award, BookOpen, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/students")({
  component: AdminStudentsPage,
});

interface StudentStats {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
  enrolled_count: number;
  average_progress: number;
  attendance_rate: number;
  is_suspended: boolean;
}

function AdminStudentsPage() {
  const qc = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [certCourseId, setCertCourseId] = useState("");

  async function suspendUser(userId: string, reason: string) {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: reason,
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to suspend user: " + error.message);
      return;
    }

    toast.success("User suspended successfully");
    qc.invalidateQueries({ queryKey: ["admin-students-list"] });
    setSelectedStudent(null);
  }

  async function unsuspendUser(userId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_suspended: false,
        suspended_at: null,
        suspended_reason: null,
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to unsuspend: " + error.message);
      return;
    }

    toast.success("User unsuspended successfully");
    qc.invalidateQueries({ queryKey: ["admin-students-list"] });
    setSelectedStudent(null);
  }

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin-students-list"],
    queryFn: async () => {
      // 1. Fetch all student profiles
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student");

      if (pError) throw pError;

      // 2. Fetch all enrollments
      const { data: enrollments, error: eError } = await supabase
        .from("enrollments")
        .select("student_id, progress");
      if (eError) throw eError;

      // 3. Fetch all attendance
      const { data: attendance, error: aError } = await supabase
        .from("attendance")
        .select("student_id, attended");
      if (aError) throw aError;

      // Map profiles with statistics
      return profiles.map((p: any) => {
        const studentEnrollments = (enrollments ?? []).filter((e: any) => e.student_id === p.id);
        const studentAttendance = (attendance ?? []).filter((a: any) => a.student_id === p.id);

        const progressSum = studentEnrollments.reduce(
          (sum: number, e: any) => sum + (e.progress ?? 0),
          0,
        );
        const averageProgress = studentEnrollments.length
          ? Math.round(progressSum / studentEnrollments.length)
          : 0;

        const attendedSessions = studentAttendance.filter((a: any) => a.attended).length;
        const attendanceRate = studentAttendance.length
          ? Math.round((attendedSessions / studentAttendance.length) * 100)
          : 100; // default 100% if no sessions scheduled yet

        return {
          id: p.id,
          full_name: p.full_name,
          email: p.full_name?.includes("@") ? p.full_name : `${p.id.slice(0, 5)}@mrsoft.edu`, // mock fallback if full_name is email
          phone: p.phone,
          company: p.company,
          created_at: p.created_at,
          enrolled_count: studentEnrollments.length,
          average_progress: averageProgress,
          attendance_rate: attendanceRate,
          is_suspended: p.is_suspended ?? false,
        } as StudentStats;
      });
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["admin-published-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("is_published", true);
      if (error) throw error;
      return data;
    },
  });

  const enrollStudent = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || !selectedCourseId) return;
      const { error } = await supabase.from("enrollments").insert({
        student_id: selectedStudent.id,
        course_id: selectedCourseId,
        progress: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student enrolled in course successfully!");
      setEnrollModalOpen(false);
      setSelectedCourseId("");
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
    },
    onError: (e: any) => {
      toast.error(e.message ?? "Already enrolled in this course");
    },
  });

  const awardCertificate = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || !certCourseId) return;
      const { error } = await supabase.from("certificates").insert({
        student_id: selectedStudent.id,
        course_id: certCourseId,
        pdf_url: `https://mrsoft-pearl.vercel.app/certificates/pdf/${selectedStudent.id}-${certCourseId}.pdf`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Certificate issued successfully!");
      setCertModalOpen(false);
      setCertCourseId("");
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
    },
    onError: (e: any) => {
      toast.error(e.message ?? "Certificate already issued for this course");
    },
  });

  const columns = [
    { key: "full_name", header: "Name", render: (item: StudentStats) => item.full_name ?? "—" },
    { key: "email", header: "Email", render: (item: StudentStats) => item.email ?? "—" },
    {
      key: "enrolled_count",
      header: "Enrolled Courses",
      render: (item: StudentStats) => item.enrolled_count,
    },
    {
      key: "average_progress",
      header: "Avg Progress",
      render: (item: StudentStats) => `${item.average_progress}%`,
    },
    {
      key: "attendance_rate",
      header: "Attendance %",
      render: (item: StudentStats) => `${item.attendance_rate}%`,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students Directory</h1>
          <p className="text-white/50 text-sm mt-1">
            Review progress metrics, schedule enrollments, and award performance certificates.
          </p>
        </div>

        {/* Directory Table */}
        {isLoading ? (
          <div className="h-96 rounded-xl bg-white/5 animate-pulse border border-[rgba(26,107,26,0.3)]" />
        ) : (
          <DataTable
            columns={columns}
            data={students}
            onRowClick={(row) => setSelectedStudent(row)}
          />
        )}
      </div>

      {/* Student Details Side Card/Modal */}
      <Modal
        isOpen={!!selectedStudent && !enrollModalOpen && !certModalOpen}
        onClose={() => setSelectedStudent(null)}
        title="Student Details"
      >
        {selectedStudent && (
          <div className="space-y-4 text-sm text-white/95">
            <div className="flex items-center gap-3 border-b border-[rgba(26,107,26,0.15)] pb-3">
              <div className="bg-[#1A6B1A]/10 text-[#22c55e] border border-[#1A6B1A]/30 p-2.5 rounded-full">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">{selectedStudent.full_name}</h4>
                <p className="text-xs text-white/50">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="bg-[#0A0A0A] p-2.5 rounded-lg border border-white/5 text-center">
                <p className="text-[10px] text-white/50 font-semibold uppercase">Enrolled</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {selectedStudent.enrolled_count}
                </p>
              </div>
              <div className="bg-[#0A0A0A] p-2.5 rounded-lg border border-white/5 text-center">
                <p className="text-[10px] text-white/50 font-semibold uppercase">Avg Progress</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {selectedStudent.average_progress}%
                </p>
              </div>
              <div className="bg-[#0A0A0A] p-2.5 rounded-lg border border-white/5 text-center">
                <p className="text-[10px] text-white/50 font-semibold uppercase">Attendance</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {selectedStudent.attendance_rate}%
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(26,107,26,0.15)]">
              <Button
                className="w-full bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white flex items-center justify-center gap-2"
                onClick={() => setEnrollModalOpen(true)}
              >
                <BookOpen className="h-4 w-4" />
                Enroll In Course
              </Button>
              <Button
                className="w-full bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center justify-center gap-2"
                onClick={() => setCertModalOpen(true)}
              >
                <Award className="h-4 w-4" />
                Award Certificate
              </Button>
              {selectedStudent.is_suspended ? (
                <Button
                  className="w-full bg-green-700 hover:bg-green-800 text-white flex items-center justify-center gap-2"
                  onClick={() => {
                    if (
                      confirm(`Are you sure you want to unsuspend ${selectedStudent.full_name}?`)
                    ) {
                      unsuspendUser(selectedStudent.id);
                    }
                  }}
                >
                  Unsuspend Student
                </Button>
              ) : (
                <Button
                  className="w-full bg-red-700 hover:bg-red-800 text-white flex items-center justify-center gap-2"
                  onClick={() => {
                    const reason = prompt(`Enter reason to suspend ${selectedStudent.full_name}:`);
                    if (reason) {
                      suspendUser(selectedStudent.id, reason);
                    }
                  }}
                >
                  Suspend Student
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-[rgba(26,107,26,0.3)] text-white hover:bg-white/5"
                onClick={() => setSelectedStudent(null)}
              >
                Close Panel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Enroll Course Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Enroll Student in Course"
      >
        <div className="space-y-4">
          <p className="text-xs text-white/60">
            Select a published course to enroll{" "}
            <strong className="text-white">{selectedStudent?.full_name}</strong> into.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50">Course Title</label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-full bg-[#060606] border-[rgba(26,107,26,0.3)] text-white">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
                {courses.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(26,107,26,0.1)]">
            <Button
              variant="outline"
              className="border-[rgba(26,107,26,0.3)] text-white/70 hover:bg-white/5"
              onClick={() => {
                setEnrollModalOpen(false);
                setSelectedCourseId("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={enrollStudent.isPending || !selectedCourseId}
              className="bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white"
              onClick={() => enrollStudent.mutate()}
            >
              {enrollStudent.isPending ? "Enrolling..." : "Enroll"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Award Certificate Modal */}
      <Modal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        title="Award Completion Certificate"
      >
        <div className="space-y-4">
          <p className="text-xs text-white/60">
            Issue a verified certification to{" "}
            <strong className="text-white">{selectedStudent?.full_name}</strong>.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50">Course Title</label>
            <Select value={certCourseId} onValueChange={setCertCourseId}>
              <SelectTrigger className="w-full bg-[#060606] border-[rgba(26,107,26,0.3)] text-white">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
                {courses.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(26,107,26,0.1)]">
            <Button
              variant="outline"
              className="border-[rgba(26,107,26,0.3)] text-white/70 hover:bg-white/5"
              onClick={() => {
                setCertModalOpen(false);
                setCertCourseId("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={awardCertificate.isPending || !certCourseId}
              className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white"
              onClick={() => awardCertificate.mutate()}
            >
              {awardCertificate.isPending ? "Issuing..." : "Award Certificate"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
