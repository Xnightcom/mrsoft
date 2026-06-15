import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Modal } from "@/components/dashboard/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, BookOpen, Clock, Users, Play, Trash2, X, FileText, Edit } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/courses")({
  component: AdminCoursesPage,
});

function AdminCoursesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // --- FIX 5: COURSE LIST DISPLAY ---
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const showToast = (msg: string, type: "success" | "error" | "warning") => {
    if (type === "success") toast.success(msg);
    else if (type === "error") toast.error(msg);
    else toast.warning(msg);
  };

  async function fetchCourses() {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        level,
        is_published,
        max_students,
        class_schedule,
        created_at,
        instructor:profiles!instructor_id (
          id,
          full_name
        ),
        enrollments (id),
        course_books (id, title)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch courses error:', error);
      showToast('Failed to load courses', 'error');
    } else {
      setCourses(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  // --- FIX 3: ASSIGN INSTRUCTOR DROPDOWN ---
  const [instructors, setInstructors] = useState<any[]>([]);

  useEffect(() => {
    fetchInstructors();
  }, []);

  async function fetchInstructors() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'instructor')
      .eq('is_suspended', false)
      .order('full_name');
    
    console.log('Instructors:', data, error);
    setInstructors(data ?? []);
  }

  // --- FIX 2: COURSE CREATION MUST WORK ---
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_hours: "10",
    level: "beginner",
    max_students: 30,
    instructor_id: "",
    is_published: false,
    sessions: [{ day: "Monday", time: "10:00 AM", duration_mins: 90 }] as any[],
    books: [] as any[]
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => setFormData({
    title: "",
    description: "",
    duration_hours: "10",
    level: "beginner",
    max_students: 30,
    instructor_id: "",
    is_published: false,
    sessions: [{ day: "Monday", time: "10:00 AM", duration_mins: 90 }],
    books: []
  });

  async function handleCreateCourse() {
    // Validate required fields
    if (!formData.title?.trim()) {
      showToast('Course title is required', 'error')
      return
    }
    
    setSaving(true)
    
    try {
      const { data: { session } } = 
        await supabase.auth.getSession()
      
      if (!session) {
        showToast('Not authenticated', 'error')
        return
      }

      console.log('Current user ID:', session?.user?.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session?.user?.id)
        .maybeSingle()

      console.log('Current role:', profile?.role)

      if (profile?.role !== 'admin') {
        showToast(
          'Only admins can create courses', 
          'error'
        )
        return
      }

      // Build course object with only valid columns
      const coursePayload = {
        title: formData.title.trim(),
        description: formData.description?.trim() 
          ?? '',
        level: formData.level ?? 'beginner',
        duration_hours: Number(formData.duration_hours) 
          || 0,
        max_students: Number(formData.max_students) 
          || 30,
        instructor_id: formData.instructor_id 
          || null,
        class_schedule: formData.sessions ?? [],
        is_published: formData.is_published ?? false,
      }

      console.log('Creating course:', coursePayload)

      // Insert course
      const { data: course, error: courseError } = 
        await supabase
          .from('courses')
          .insert(coursePayload)
          .select()
          .maybeSingle()

      if (courseError) {
        console.error('Course error:', courseError)
        showToast(
          'Failed to create course: ' + 
          courseError.message, 
          'error'
        )
        return
      }

      console.log('Course created:', course)

      // Insert books if any
      if (formData.books?.length > 0 && course?.id) {
        const bookRecords = formData.books
          .filter(b => b.title?.trim())
          .map((book, i) => ({
            course_id: course.id,
            title: book.title.trim(),
            description: book.description?.trim() 
              ?? '',
            pdf_url: book.pdf_url ?? '',
            order_index: i
          }))

        if (bookRecords.length > 0) {
          const { error: bookError } = await supabase
            .from('course_books')
            .insert(bookRecords)

          if (bookError) {
            console.error('Book error:', bookError)
            showToast(
              'Course created but books failed: ' + 
              bookError.message, 
              'warning'
            )
          }
        }
      }

      // Success
      showToast('Course created successfully! 🎉', 
        'success')
      setShowModal(false)
      resetForm()
      await fetchCourses()

    } catch (err: any) {
      console.error('Unexpected error:', err)
      showToast('Unexpected error: ' + err.message, 
        'error')
    } finally {
      setSaving(false)
    }
  }

  // --- FIX 4: ASSIGN COURSE TO STUDENT ---
  const [enrollModal, setEnrollModal] = useState(false)
  const [enrollCourseId, setEnrollCourseId] = useState<string | null>(null)
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [search, setSearch] = useState("");

  async function fetchAvailableStudents(courseId: string) {
    // Get all students
    const { data: allStudents } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student')
      .eq('is_suspended', false)
    
    // Get already enrolled
    const { data: enrolled } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId)
    
    const enrolledIds = enrolled?.map(
      (e: any) => e.student_id
    ) ?? []
    
    // Filter out already enrolled
    const available = allStudents?.filter(
      (s: any) => !enrolledIds.includes(s.id)
    ) ?? []
    
    setAvailableStudents(available)
  }

  async function enrollStudents() {
    if (selectedStudents.length === 0) {
      showToast('Select at least one student', 
        'warning')
      return
    }
    setEnrolling(true)
    
    const records = selectedStudents.map(sid => ({
      student_id: sid,
      course_id: enrollCourseId,
      progress: 0
    }))
    
    const { error } = await supabase
      .from('enrollments')
      .upsert(records, {
        onConflict: 'student_id,course_id',
        ignoreDuplicates: true
      })
    
    setEnrolling(false)
    
    if (error) {
      showToast('Enrollment failed: ' 
        + error.message, 'error')
    } else {
      showToast(
        `${selectedStudents.length} student(s) enrolled successfully! 🎉`,
        'success'
      )
      setEnrollModal(false)
      setSelectedStudents([])
      fetchCourses()
    }
  }

  // --- EXISTING MUTATIONS (Delete, Toggle, Lesson) ---
  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("courses").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Course status updated");
      fetchCourses();
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Course deleted successfully");
      fetchCourses();
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const [lessonForm, setLessonForm] = useState({
    title: "", content_url: "", duration_minutes: "30", order_index: "1", is_published: true,
  });
  const createLesson = useMutation({
    mutationFn: async () => {
      if (!selectedCourse) return;
      const { error } = await supabase.from("lessons").insert({
        course_id: selectedCourse.id,
        title: lessonForm.title,
        content_url: lessonForm.content_url || "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration_minutes: parseInt(lessonForm.duration_minutes) || 30,
        order_index: parseInt(lessonForm.order_index) || 1,
        is_published: lessonForm.is_published,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lesson added successfully!");
      setLessonModalOpen(false);
      setLessonForm({ title: "", content_url: "", duration_minutes: "30", order_index: "1", is_published: true });
      setSelectedCourse(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Courses Management</h1>
            <p className="text-white/50 text-sm mt-1">
              Add courses, assign instructors, and manage schedules.
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Course
          </Button>
        </div>

        {/* Grid Display */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.length === 0 ? (
              <div className="col-span-full border border-dashed border-white/10 rounded-xl p-12 text-center text-white/50">
                No courses created yet. Click "Add Course" above.
              </div>
            ) : (
              courses.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] hover:border-[#CC0000]/50 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(204,0,0,0.15)] flex flex-col justify-between course-card"
                >
                  <div>
                    <div className="p-4 space-y-2 relative">
                      <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-[#1A6B1A]/20 text-[#1A6B1A] text-[10px] font-bold uppercase tracking-wider">
                        {course.level}
                      </span>
                      <h4 className="font-bold text-white text-lg pr-16 line-clamp-1">{course.title}</h4>
                      
                      {/* Instructor name OR Unassigned */}
                      <p className="text-sm font-medium">
                        {course.instructor ? (
                          <span className="text-white/80">{course.instructor.full_name}</span>
                        ) : (
                          <span className="text-amber-500">Unassigned</span>
                        )}
                      </p>

                      <p className="text-white/60 text-xs line-clamp-2">{course.description}</p>

                      <div className="flex items-center gap-4 text-xs text-white/50 pt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.enrollments?.length || 0} / {course.max_students}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {course.course_books?.length || 0} Books
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-[#0A0A0A] border-t border-[rgba(26,107,26,0.15)] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={course.is_published}
                          onCheckedChange={(checked) =>
                            togglePublish.mutate({ id: course.id, is_published: checked })
                          }
                        />
                        <span className="text-xs font-semibold text-white/70">
                          {course.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-[rgba(26,107,26,0.3)] text-[#1A6B1A] hover:bg-[#1A6B1A]/10 hover:text-white flex items-center justify-center gap-1 text-[11px]"
                        onClick={() => {
                          setEnrollCourseId(course.id);
                          setEnrollModal(true);
                          setSearch("");
                          setSelectedStudents([]);
                          fetchAvailableStudents(course.id);
                        }}
                      >
                        👥 Enroll Students
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10 flex items-center justify-center gap-1 text-[11px]"
                        onClick={() => {
                          setSelectedCourse(course);
                          setLessonModalOpen(true);
                        }}
                      >
                        ✏️ Edit Lessons
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-1 text-[11px]"
                        onClick={() => {
                          if (confirm("Delete this course? All data will be wiped.")) {
                            deleteCourse.mutate(course.id);
                          }
                        }}
                      >
                        🗑 Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            overflowY: 'auto',
            padding: '24px 16px',
          }}
        >
          <div
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(204,0,0,0.3)',
              borderRadius: 16,
              padding: 32,
              width: '100%',
              maxWidth: 600,
              margin: '0 auto',
              position: 'relative',
            }}
          >
            {/* X close button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 20,
                cursor: 'pointer',
                lineHeight: 1,
                padding: 4,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.target.style.color = '#CC0000'
                e.target.style.transform = 'rotate(90deg)'
              }}
              onMouseLeave={e => {
                e.target.style.color = 
                  'rgba(255,255,255,0.5)'
                e.target.style.transform = 'rotate(0deg)'
              }}
            >
              ✕
            </button>

            {/* Modal title */}
            <h2 style={{
              color: 'white',
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 24,
              paddingRight: 32
            }}>
              Add New Course
            </h2>

            {/* FIELD 1 - Course Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                display: 'block',
                marginBottom: 6,
                fontWeight: 500
              }}>
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title ?? ''}
                onChange={e => setFormData(p => ({
                  ...p, title: e.target.value
                }))}
                placeholder="e.g. Web Development Fundamentals"
                style={{
                  width: '100%',
                  background: '#111',
                  border: '1px solid rgba(26,107,26,0.4)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: 'white',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* FIELD 2 - Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                display: 'block',
                marginBottom: 6,
                fontWeight: 500
              }}>
                Description
              </label>
              <textarea
                value={formData.description ?? ''}
                onChange={e => setFormData(p => ({
                  ...p, description: e.target.value
                }))}
                placeholder="Provide a summary of goals and outline..."
                rows={3}
                style={{
                  width: '100%',
                  background: '#111',
                  border: '1px solid rgba(26,107,26,0.4)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: 'white',
                  fontSize: 14,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* FIELD 3+4 - Level + Duration side by side */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16
            }}>
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  display: 'block',
                  marginBottom: 6
                }}>Level</label>
                <select
                  value={formData.level ?? 'beginner'}
                  onChange={e => setFormData(p => ({
                    ...p, level: e.target.value
                  }))}
                  style={{
                    width: '100%',
                    background: '#111',
                    border: '1px solid rgba(26,107,26,0.4)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">
                    Intermediate
                  </option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  display: 'block',
                  marginBottom: 6
                }}>Duration (Hours)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration_hours ?? 10}
                  onChange={e => setFormData(p => ({
                    ...p, 
                    duration_hours: Number(e.target.value)
                  }))}
                  style={{
                    width: '100%',
                    background: '#111',
                    border: '1px solid rgba(26,107,26,0.4)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* FIELD 5+6 - Max Students + Instructor */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 20
            }}>
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  display: 'block',
                  marginBottom: 6
                }}>Max Students</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_students ?? 30}
                  onChange={e => setFormData(p => ({
                    ...p,
                    max_students: Number(e.target.value)
                  }))}
                  style={{
                    width: '100%',
                    background: '#111',
                    border: '1px solid rgba(26,107,26,0.4)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  display: 'block',
                  marginBottom: 6
                }}>Assign Instructor</label>
                <select
                  value={formData.instructor_id ?? ''}
                  onChange={e => setFormData(p => ({
                    ...p,
                    instructor_id: e.target.value || ""
                  }))}
                  style={{
                    width: '100%',
                    background: '#111',
                    border: '1px solid rgba(26,107,26,0.4)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">
                    -- Select Instructor --
                  </option>
                  {instructors?.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.full_name}
                    </option>
                  ))}
                </select>
                {(!instructors || instructors.length === 0) && (
                  <p style={{
                    color: '#F59E0B',
                    fontSize: 11,
                    marginTop: 4
                  }}>
                    ⚠️ No instructors — assign role in Users
                  </p>
                )}
              </div>
            </div>

          {/* Class Schedule */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <Label className="text-white/90 font-bold">Class Schedule</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] border-[rgba(26,107,26,0.3)]"
                onClick={() => setFormData({
                  ...formData, 
                  sessions: [...formData.sessions, { day: "Monday", time: "10:00 AM", duration_mins: 90 }]
                })}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Session
              </Button>
            </div>
            {formData.sessions.map((session, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={session.day}
                  onValueChange={(val) => {
                    const newSch = [...formData.sessions];
                    newSch[i].day = val;
                    setFormData({ ...formData, sessions: newSch });
                  }}
                >
                  <SelectTrigger className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F0F] text-white border-[rgba(26,107,26,0.3)]">
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="10:00 AM" 
                  value={session.time} 
                  onChange={(e) => {
                    const newSch = [...formData.sessions];
                    newSch[i].time = e.target.value;
                    setFormData({ ...formData, sessions: newSch });
                  }} 
                  className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white w-[100px]" 
                />
                <Input 
                  type="number" 
                  placeholder="90" 
                  value={session.duration_mins} 
                  onChange={(e) => {
                    const newSch = [...formData.sessions];
                    newSch[i].duration_mins = parseInt(e.target.value) || 90;
                    setFormData({ ...formData, sessions: newSch });
                  }} 
                  className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white w-[80px]" 
                />
                <span className="text-white/50 text-[10px]">mins</span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 ml-auto"
                  onClick={() => {
                    const newSch = formData.sessions.filter((_, idx) => idx !== i);
                    setFormData({ ...formData, sessions: newSch });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Course Books */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <Label className="text-white/90 font-bold">Course Books</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] border-[rgba(26,107,26,0.3)]"
                onClick={() => setFormData({
                  ...formData, 
                  books: [...formData.books, { title: "", description: "", pdf_url: "" }]
                })}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Book
              </Button>
            </div>
            {formData.books.map((book, i) => (
              <div key={i} className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10 relative">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 text-white/50 hover:text-red-500"
                  onClick={() => {
                    const newBooks = formData.books.filter((_, idx) => idx !== i);
                    setFormData({ ...formData, books: newBooks });
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
                <div>
                  <Input 
                    placeholder="Book Title" 
                    value={book.title}
                    onChange={(e) => {
                      const newBooks = [...formData.books];
                      newBooks[i].title = e.target.value;
                      setFormData({ ...formData, books: newBooks });
                    }}
                    className="h-8 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white text-xs" 
                  />
                </div>
                <div>
                  <Input 
                    placeholder="Short description" 
                    value={book.description}
                    onChange={(e) => {
                      const newBooks = [...formData.books];
                      newBooks[i].description = e.target.value;
                      setFormData({ ...formData, books: newBooks });
                    }}
                    className="h-8 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white text-xs" 
                  />
                </div>
                <div>
                  <Input 
                    placeholder="PDF URL (optional)" 
                    value={book.pdf_url}
                    onChange={(e) => {
                      const newBooks = [...formData.books];
                      newBooks[i].pdf_url = e.target.value;
                      setFormData({ ...formData, books: newBooks });
                    }}
                    className="h-8 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white text-xs" 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <Switch
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
            />
            <Label className="text-white/80">Publish immediately</Label>
          </div>

          {/* Bottom buttons */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.6)',
                  padding: '10px 24px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={saving || !formData.title?.trim()}
                style={{
                  background: saving 
                    ? 'rgba(204,0,0,0.5)' 
                    : '#CC0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => {
          setLessonModalOpen(false);
          setSelectedCourse(null);
        }}
        title={`Add Lesson for ${selectedCourse?.title}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLesson.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="space-y-1">
            <Label className="text-white/70">Lesson Title</Label>
            <Input
              required
              placeholder="e.g. Introduction to HTML and DOM"
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-white/70">Content Link (Video or Document URL)</Label>
            <Input
              placeholder="https://..."
              value={lessonForm.content_url}
              onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })}
              className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-white/70">Duration (Minutes)</Label>
              <Input
                type="number"
                value={lessonForm.duration_minutes}
                onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white/70">Order Index (Sequence)</Label>
              <Input
                type="number"
                value={lessonForm.order_index}
                onChange={(e) => setLessonForm({ ...lessonForm, order_index: e.target.value })}
                className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch
              checked={lessonForm.is_published}
              onCheckedChange={(checked) => setLessonForm({ ...lessonForm, is_published: checked })}
            />
            <Label className="text-white/80">Make visible to students</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(26,107,26,0.1)]">
            <Button
              type="button"
              variant="outline"
              className="border-[rgba(26,107,26,0.3)] text-white/70 hover:bg-white/5"
              onClick={() => {
                setLessonModalOpen(false);
                setSelectedCourse(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createLesson.isPending}
              className="bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white"
            >
              {createLesson.isPending ? "Adding..." : "Add Lesson"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enroll Students Modal */}
      <Modal
        isOpen={enrollModal}
        onClose={() => setEnrollModal(false)}
        title={`Enroll Students`}
      >
        <div className="space-y-4">
          <Input
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
          />

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {availableStudents
              .filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()))
              .map(student => (
                <label key={student.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderRadius: 8,
                  background: selectedStudents.includes(student.id)
                    ? 'rgba(26,107,26,0.1)'
                    : 'transparent',
                  border: selectedStudents.includes(student.id)
                    ? '1px solid rgba(26,107,26,0.3)'
                    : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedStudents(prev => [...prev, student.id])
                      } else {
                        setSelectedStudents(prev => prev.filter(id => id !== student.id))
                      }
                    }}
                    style={{ accentColor: '#1A6B1A' }}
                  />
                  <div style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    background: '#1A6B1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 13
                  }}>
                    {student.full_name[0]}
                  </div>
                  <span style={{ color: 'white' }}>
                    {student.full_name}
                  </span>
                </label>
              ))
            }
            {availableStudents.length === 0 && (
              <div className="text-center text-white/50 py-4">
                No available students to enroll.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-white/70 text-sm">
              {selectedStudents.length} students selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedStudents.length === availableStudents.length) {
                    setSelectedStudents([]);
                  } else {
                    setSelectedStudents(availableStudents.map(s => s.id));
                  }
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {selectedStudents.length === availableStudents.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                onClick={enrollStudents}
                disabled={enrolling}
                className="bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white"
              >
                {enrolling ? "Enrolling..." : "Enroll Selected"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  );
}
