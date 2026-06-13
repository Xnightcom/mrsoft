import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Modal } from "@/components/dashboard/Modal";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen, Users, CheckSquare, Calendar as CalendarIcon, FileText, Download, Edit3, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/instructor/courses")({
  component: InstructorCoursesPage,
});

function InstructorCoursesPage() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  // Attendance state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // New assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    due_date: "",
    max_grade: 100,
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["instructor-courses", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Queries for the selected course
  const { data: enrollments = [] } = useQuery({
    queryKey: ["course-enrollments", selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse?.id) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          student:profiles!enrollments_student_id_fkey(id, full_name, avatar_url)
        `)
        .eq("course_id", selectedCourse.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse?.id,
  });

  const { data: books = [] } = useQuery({
    queryKey: ["course-books", selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse?.id) return [];
      const { data, error } = await supabase
        .from("course_books")
        .select("*")
        .eq("course_id", selectedCourse.id)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse?.id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["course-assignments", selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse?.id) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select("*, student:profiles!assignments_student_id_fkey(id, full_name)")
        .eq("course_id", selectedCourse.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse?.id,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["course-attendance", selectedCourse?.id, selectedDate],
    queryFn: async () => {
      if (!selectedCourse?.id) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("student_id, attended")
        .eq("course_id", selectedCourse.id)
        .eq("session_date", selectedDate);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse?.id,
  });

  React.useEffect(() => {
    const map: Record<string, boolean> = {};
    attendance.forEach((a: any) => {
      map[a.student_id] = a.attended;
    });
    setAttendanceState(map);
  }, [attendance]);

  // Mutations
  const updateProgress = useMutation({
    mutationFn: async ({ enrollmentId, progress, notes }: { enrollmentId: string; progress: number; notes: string }) => {
      const { error } = await supabase
        .from("enrollments")
        .update({
          progress_percent: progress,
          instructor_notes: notes,
          last_updated_by: profile?.id,
        })
        .eq("id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Progress updated");
      qc.invalidateQueries({ queryKey: ["course-enrollments", selectedCourse?.id] });
    },
  });

  const createAssignment = useMutation({
    mutationFn: async () => {
      if (!selectedCourse || !profile) return;
      
      // Create assignment for ALL enrolled students
      const inserts = enrollments.map((enr: any) => ({
        course_id: selectedCourse.id,
        student_id: enr.student_id,
        title: assignmentForm.title,
        description: assignmentForm.description,
        due_date: assignmentForm.due_date ? new Date(assignmentForm.due_date).toISOString() : null,
        created_by: profile.id,
        max_grade: assignmentForm.max_grade,
      }));

      if (inserts.length === 0) {
        throw new Error("No students enrolled. Cannot create assignment.");
      }

      const { error } = await supabase.from("assignments").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment created and distributed to students");
      setAssignmentForm({ title: "", description: "", due_date: "", max_grade: 100 });
      qc.invalidateQueries({ queryKey: ["course-assignments", selectedCourse?.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const gradeAssignment = useMutation({
    mutationFn: async ({ assignmentId, grade, feedback }: { assignmentId: string; grade: number; feedback: string }) => {
      const { error } = await supabase
        .from("assignments")
        .update({
          grade,
          feedback,
          graded_at: new Date().toISOString(),
          graded_by: profile?.id,
        })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment graded");
      qc.invalidateQueries({ queryKey: ["course-assignments", selectedCourse?.id] });
    },
  });

  const saveAttendance = async () => {
    setSavingAttendance(true);
    const records = enrollments.map((enr: any) => ({
      student_id: enr.student_id,
      course_id: selectedCourse?.id,
      session_date: selectedDate,
      attended: attendanceState[enr.student_id] ?? false
    }));
    
    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,course_id,session_date' });
      
    setSavingAttendance(false);
    if (error) {
      toast.error('Failed to save attendance');
    } else {
      toast.success('Attendance saved!');
      qc.invalidateQueries({ queryKey: ["course-attendance"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage your assigned classes, students, and materials.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full border border-dashed border-white/10 rounded-xl p-12 text-center text-white/50">
            You have no assigned courses. Contact an administrator.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => (
              <div
                key={course.id}
                className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl overflow-hidden shadow-md transition-all duration-300"
              >
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-white text-lg line-clamp-1">{course.title}</h4>
                  <p className="text-white/60 text-xs line-clamp-2">{course.description}</p>
                  
                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={() => {
                        setSelectedCourse(course);
                        setManageModalOpen(true);
                      }}
                      className="bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white w-full"
                    >
                      Manage Course
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        title={`Manage: ${selectedCourse?.title}`}
        className="max-w-4xl"
      >
        <Tabs defaultValue="students" className="mt-2">
          <TabsList className="bg-white/5 border border-white/10 grid grid-cols-4 w-full h-10">
            <TabsTrigger value="students" className="data-[state=active]:bg-[#CC0000] text-xs">Students</TabsTrigger>
            <TabsTrigger value="books" className="data-[state=active]:bg-[#CC0000] text-xs">Books</TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#CC0000] text-xs">Attendance</TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-[#CC0000] text-xs">Assignments</TabsTrigger>
          </TabsList>

          {/* STUDENTS TAB */}
          <TabsContent value="students" className="mt-4 space-y-4">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {enrollments.length === 0 ? (
                <p className="text-white/50 text-center py-8">No students enrolled yet.</p>
              ) : (
                enrollments.map((enr: any) => (
                  <div key={enr.id} className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                        {enr.student?.avatar_url ? (
                          <img src={enr.student.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-4 w-4 text-white/50" />
                        )}
                      </div>
                      <p className="font-medium text-white text-sm truncate">{enr.student?.full_name}</p>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3">
                      <Label className="text-xs text-white/70 whitespace-nowrap">Progress %</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        defaultValue={enr.progress_percent}
                        className="w-20 h-8 bg-[#060606] border-white/20 text-white text-xs"
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val !== enr.progress_percent) {
                            updateProgress.mutate({ enrollmentId: enr.id, progress: val, notes: enr.instructor_notes || "" });
                          }
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* BOOKS TAB */}
          <TabsContent value="books" className="mt-4 space-y-4">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {books.length === 0 ? (
                <p className="text-white/50 text-center py-8">No course books added by Admin.</p>
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
                      className="border-white/20 hover:bg-white/10"
                      onClick={async () => {
                        const { data } = await supabase.storage.from("course-books").createSignedUrl(book.pdf_url, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                        else toast.error("Could not generate download link");
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" /> View PDF
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="mt-4 space-y-4">
             <div className="border border-white/10 rounded-lg p-4 bg-[#0A0A0A]">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-white text-sm">Attendance Register</h3>
                 <div className="flex items-center gap-3">
                   <Label className="text-white/70 text-xs">Date:</Label>
                   <Input 
                     type="date" 
                     value={selectedDate} 
                     onChange={(e) => setSelectedDate(e.target.value)}
                     className="bg-[#060606] border-white/20 text-white text-sm h-8 w-40"
                   />
                 </div>
               </div>

               <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                 {enrollments.map((enr: any) => (
                   <div key={enr.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                     <span className="text-sm text-white font-medium">{enr.student?.full_name}</span>
                     <div className="flex gap-2">
                       <Button 
                         size="sm" 
                         variant={attendanceState[enr.student_id] === true ? "default" : "outline"}
                         className={`h-8 text-xs transition-colors ${attendanceState[enr.student_id] === true ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : 'border-green-500/30 text-green-500 hover:bg-green-500/10'}`}
                         onClick={() => setAttendanceState(p => ({ ...p, [enr.student_id]: true }))}
                       >
                         ✓ Present
                       </Button>
                       <Button 
                         size="sm" 
                         variant={attendanceState[enr.student_id] === false ? "default" : "outline"}
                         className={`h-8 text-xs transition-colors ${attendanceState[enr.student_id] === false ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : 'border-red-500/30 text-red-500 hover:bg-red-500/10'}`}
                         onClick={() => setAttendanceState(p => ({ ...p, [enr.student_id]: false }))}
                       >
                         ✗ Absent
                       </Button>
                     </div>
                   </div>
                 ))}
                 {enrollments.length === 0 && <p className="text-center text-white/50 text-sm">No students enrolled.</p>}
               </div>

               <div className="flex justify-between items-center border-t border-white/10 pt-4">
                 <div className="flex gap-2">
                   <Button size="sm" variant="outline" className="text-xs bg-white/5 border-white/10 text-white" onClick={() => {
                     const map: any = {};
                     enrollments.forEach((e: any) => map[e.student_id] = true);
                     setAttendanceState(map);
                   }}>Mark All Present</Button>
                   <Button size="sm" variant="outline" className="text-xs bg-white/5 border-white/10 text-white" onClick={() => {
                     const map: any = {};
                     enrollments.forEach((e: any) => map[e.student_id] = false);
                     setAttendanceState(map);
                   }}>Mark All Absent</Button>
                 </div>
                 <Button onClick={saveAttendance} disabled={savingAttendance} className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white h-8 text-xs px-6">
                   {savingAttendance ? "Saving..." : "Save Attendance"}
                 </Button>
               </div>

               <div className="mt-4 p-3 bg-white/5 rounded flex justify-between text-xs text-white/70 border border-white/10">
                 <span>Total Students: <strong className="text-white">{enrollments.length}</strong></span>
                 <span>Present Today: <strong className="text-green-500">{Object.values(attendanceState).filter(v => v === true).length}</strong></span>
                 <span>Absent Today: <strong className="text-red-500">{Object.values(attendanceState).filter(v => v === false).length}</strong></span>
                 <span>Unmarked: <strong className="text-white">{enrollments.length - Object.values(attendanceState).length}</strong></span>
               </div>
             </div>
          </TabsContent>

          {/* ASSIGNMENTS TAB */}
          <TabsContent value="assignments" className="mt-4 space-y-4">
             <div className="grid grid-cols-5 gap-4 h-[60vh]">
                <div className="col-span-2 border border-white/10 rounded-lg p-4 bg-[#0A0A0A] overflow-y-auto">
                  <h3 className="font-bold text-white mb-4 text-sm border-b border-white/10 pb-2">Create Assignment</h3>
                  <form onSubmit={(e) => { e.preventDefault(); createAssignment.mutate(); }} className="space-y-3">
                    <div>
                      <Label className="text-xs text-white/70">Title</Label>
                      <Input required value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} className="h-8 text-xs bg-[#060606] border-white/20" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/70">Description</Label>
                      <Textarea value={assignmentForm.description} onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} className="min-h-[80px] text-xs bg-[#060606] border-white/20" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-white/70">Due Date</Label>
                        <Input type="date" value={assignmentForm.due_date} onChange={e => setAssignmentForm({...assignmentForm, due_date: e.target.value})} className="h-8 text-xs bg-[#060606] border-white/20" />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs text-white/70">Max Grade</Label>
                        <Input type="number" value={assignmentForm.max_grade} onChange={e => setAssignmentForm({...assignmentForm, max_grade: parseInt(e.target.value)})} className="h-8 text-xs bg-[#060606] border-white/20" />
                      </div>
                    </div>
                    <Button type="submit" disabled={createAssignment.isPending} className="w-full h-8 text-xs bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white">Create</Button>
                  </form>
                </div>
                
                <div className="col-span-3 border border-white/10 rounded-lg p-4 bg-[#0A0A0A] overflow-y-auto">
                  <h3 className="font-bold text-white mb-4 text-sm border-b border-white/10 pb-2">Submissions</h3>
                  <div className="space-y-3">
                    {assignments.map((assn: any) => (
                      <div key={assn.id} className="p-3 bg-white/5 rounded border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-white">{assn.title}</h4>
                            <p className="text-[10px] text-white/50">Student: {assn.student?.full_name}</p>
                          </div>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/70">Max: {assn.max_grade}</span>
                        </div>
                        {assn.submission_text ? (
                          <div className="text-xs text-white/80 bg-[#060606] p-2 rounded border border-white/5 mb-2 line-clamp-3">
                            {assn.submission_text}
                          </div>
                        ) : (
                          <p className="text-xs text-yellow-500/70 mb-2 italic">Not submitted yet.</p>
                        )}
                        
                        {assn.submission_text && !assn.grade && (
                          <div className="flex gap-2 items-center">
                            <Input id={`grade-${assn.id}`} type="number" placeholder="Grade" className="w-20 h-7 text-xs bg-[#060606]" />
                            <Input id={`fb-${assn.id}`} placeholder="Feedback..." className="flex-1 h-7 text-xs bg-[#060606]" />
                            <Button 
                              size="sm" 
                              className="h-7 text-[10px] bg-[#CC0000] text-white hover:bg-[#CC0000]/80"
                              onClick={() => {
                                const grade = parseInt((document.getElementById(`grade-${assn.id}`) as HTMLInputElement).value);
                                const fb = (document.getElementById(`fb-${assn.id}`) as HTMLInputElement).value;
                                if (!isNaN(grade)) {
                                  gradeAssignment.mutate({ assignmentId: assn.id, grade, feedback: fb });
                                }
                              }}
                            >
                              Grade
                            </Button>
                          </div>
                        )}
                        {assn.grade && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 text-xs">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-green-500 font-bold">{assn.grade} / {assn.max_grade}</span>
                            <span className="text-white/50 flex-1 truncate">"{assn.feedback}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </Modal>
    </DashboardLayout>
  );
}
