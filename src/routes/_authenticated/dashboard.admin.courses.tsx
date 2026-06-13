import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, BookOpen, Clock, Users, Play, Trash2, X, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/courses")({
  component: AdminCoursesPage,
});

interface Course {
  id: string;
  title: string;
  description: string | null;
  duration_hours: number | null;
  level: string;
  is_published: boolean;
  created_at: string;
  instructor_id: string | null;
  max_students: number;
  class_schedule: any;
}

interface Enrollment {
  course_id: string;
}

function AdminCoursesPage() {
  const qc = useQueryClient();
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Forms state
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    duration_hours: "10",
    level: "beginner",
    max_students: 30,
    instructor_id: "unassigned",
    is_published: false,
    class_schedule: [{ day: "Monday", time: "10:00 AM", duration_mins: 90 }],
    books: [] as { title: string; description: string; file: File | null }[]
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    content_url: "",
    duration_minutes: "30",
    order_index: "1",
    is_published: true,
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["admin-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "instructor");
      if (error) throw error;
      return data as { id: string; full_name: string }[];
    },
  });

  // Query Courses & Enrollments count
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses-grid"],
    queryFn: async () => {
      const [coursesRes, enrollsRes] = await Promise.all([
        supabase.from("courses").select("*").order("created_at", { ascending: false }),
        supabase.from("enrollments").select("course_id"),
      ]);

      if (coursesRes.error) throw coursesRes.error;

      const enrollList = (enrollsRes.data ?? []) as Enrollment[];

      return (coursesRes.data as Course[]).map((c) => {
        const enrolledCount = enrollList.filter((e) => e.course_id === c.id).length;
        return {
          ...c,
          enrolledCount,
        };
      }) as (Course & { enrolledCount: number })[];
    },
  });

  // Toggle publish state
  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("courses")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Course status updated");
      qc.invalidateQueries({ queryKey: ["admin-courses-grid"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  // Create Course
  const createCourse = useMutation({
    mutationFn: async () => {
      const { data: newCourse, error } = await supabase.from("courses").insert({
        title: courseForm.title,
        description: courseForm.description,
        duration_hours: parseInt(courseForm.duration_hours) || 10,
        level: courseForm.level,
        is_published: courseForm.is_published,
        max_students: courseForm.max_students,
        instructor_id: courseForm.instructor_id === "unassigned" ? null : courseForm.instructor_id,
        class_schedule: courseForm.class_schedule,
      }).select().maybeSingle();
      
      if (error) throw error;
      const courseId = newCourse.id;

      // Upload books
      for (let i = 0; i < courseForm.books.length; i++) {
        const book = courseForm.books[i];
        if (!book.file) continue;
        const fileExt = book.file.name.split(".").pop();
        const bookId = crypto.randomUUID();
        const filePath = `${courseId}/${bookId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("course-books")
          .upload(filePath, book.file);

        if (uploadError) throw uploadError;

        await supabase.from("course_books").insert({
          course_id: courseId,
          title: book.title,
          description: book.description,
          pdf_url: filePath,
          order_index: i,
        });
      }
    },
    onSuccess: () => {
      toast.success("Course created successfully!");
      setCourseModalOpen(false);
      setCourseForm({
        title: "",
        description: "",
        duration_hours: "10",
        level: "beginner",
        max_students: 30,
        instructor_id: "unassigned",
        is_published: false,
        class_schedule: [{ day: "Monday", time: "10:00 AM", duration_mins: 90 }],
        books: []
      });
      qc.invalidateQueries({ queryKey: ["admin-courses-grid"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  // Create Lesson
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
      setLessonForm({
        title: "",
        content_url: "",
        duration_minutes: "30",
        order_index: "1",
        is_published: true,
      });
      setSelectedCourse(null);
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
      qc.invalidateQueries({ queryKey: ["admin-courses-grid"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
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
            onClick={() => setCourseModalOpen(true)}
            className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Course
          </Button>
        </div>

        {/* Grid Display */}
        {isLoading ? (
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
                  className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] hover:border-[#CC0000]/50 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(204,0,0,0.15)] flex flex-col justify-between"
                >
                  <div>
                    <div className="p-4 space-y-2 relative">
                      <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-[#1A6B1A]/20 text-[#1A6B1A] text-[10px] font-bold uppercase tracking-wider">
                        {course.level}
                      </span>
                      <h4 className="font-bold text-white text-lg pr-16 line-clamp-1">{course.title}</h4>
                      <p className="text-white/60 text-xs line-clamp-2">{course.description}</p>

                      <div className="flex items-center gap-4 text-xs text-white/50 pt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.duration_hours} hrs
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.enrolledCount} / {course.max_students}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-[#0A0A0A] border-t border-[rgba(26,107,26,0.15)] flex items-center justify-between">
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

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[rgba(26,107,26,0.3)] text-[#1A6B1A] hover:bg-[#1A6B1A]/10 hover:text-white flex items-center gap-1 text-[11px]"
                        onClick={() => {
                          setSelectedCourse(course);
                          setLessonModalOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Lesson
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-950/40 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                        onClick={() => {
                          if (confirm("Delete this course? All data will be wiped.")) {
                            deleteCourse.mutate(course.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
      <Modal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        title="Add New Course"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCourse.mutate();
          }}
          className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2"
        >
          <div className="space-y-1">
            <Label className="text-white/70">Title</Label>
            <Input
              required
              placeholder="e.g. Fullstack Web Engineering"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-white/70">Description</Label>
            <Textarea
              placeholder="Provide a summary of goals and outline..."
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-white/70">Level</Label>
              <Select
                value={courseForm.level}
                onValueChange={(val) => setCourseForm({ ...courseForm, level: val })}
              >
                <SelectTrigger className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-white/70">Duration (Hours)</Label>
              <Input
                type="number"
                value={courseForm.duration_hours}
                onChange={(e) => setCourseForm({ ...courseForm, duration_hours: e.target.value })}
                className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-white/70">Max Students</Label>
              <Input
                type="number"
                value={courseForm.max_students}
                onChange={(e) => setCourseForm({ ...courseForm, max_students: parseInt(e.target.value) || 30 })}
                className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white/70">Assign Instructor</Label>
              <Select
                value={courseForm.instructor_id}
                onValueChange={(val) => setCourseForm({ ...courseForm, instructor_id: val })}
              >
                <SelectTrigger className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {instructors.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.full_name || 'Unnamed'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onClick={() => setCourseForm({
                  ...courseForm, 
                  class_schedule: [...courseForm.class_schedule, { day: "Monday", time: "10:00 AM", duration_mins: 90 }]
                })}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Session
              </Button>
            </div>
            {courseForm.class_schedule.map((session, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={session.day}
                  onValueChange={(val) => {
                    const newSch = [...courseForm.class_schedule];
                    newSch[i].day = val;
                    setCourseForm({ ...courseForm, class_schedule: newSch });
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
                    const newSch = [...courseForm.class_schedule];
                    newSch[i].time = e.target.value;
                    setCourseForm({ ...courseForm, class_schedule: newSch });
                  }} 
                  className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white w-[100px]" 
                />
                <Input 
                  type="number" 
                  placeholder="90" 
                  value={session.duration_mins} 
                  onChange={(e) => {
                    const newSch = [...courseForm.class_schedule];
                    newSch[i].duration_mins = parseInt(e.target.value) || 90;
                    setCourseForm({ ...courseForm, class_schedule: newSch });
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
                    const newSch = courseForm.class_schedule.filter((_, idx) => idx !== i);
                    setCourseForm({ ...courseForm, class_schedule: newSch });
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
              <Label className="text-white/90 font-bold">Course Books (PDF)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] border-[rgba(26,107,26,0.3)]"
                onClick={() => setCourseForm({
                  ...courseForm, 
                  books: [...courseForm.books, { title: "", description: "", file: null }]
                })}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Book
              </Button>
            </div>
            {courseForm.books.map((book, i) => (
              <div key={i} className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10 relative">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 text-white/50 hover:text-red-500"
                  onClick={() => {
                    const newBooks = courseForm.books.filter((_, idx) => idx !== i);
                    setCourseForm({ ...courseForm, books: newBooks });
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
                <div>
                  <Input 
                    placeholder="Book Title" 
                    value={book.title}
                    onChange={(e) => {
                      const newBooks = [...courseForm.books];
                      newBooks[i].title = e.target.value;
                      setCourseForm({ ...courseForm, books: newBooks });
                    }}
                    className="h-8 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white text-xs" 
                  />
                </div>
                <div>
                  <Input 
                    placeholder="Short description" 
                    value={book.description}
                    onChange={(e) => {
                      const newBooks = [...courseForm.books];
                      newBooks[i].description = e.target.value;
                      setCourseForm({ ...courseForm, books: newBooks });
                    }}
                    className="h-8 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white text-xs" 
                  />
                </div>
                <div>
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => {
                      const newBooks = [...courseForm.books];
                      newBooks[i].file = e.target.files?.[0] || null;
                      setCourseForm({ ...courseForm, books: newBooks });
                    }}
                    className="h-8 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white text-xs file:text-xs file:text-white/70" 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <Switch
              checked={courseForm.is_published}
              onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_published: checked })}
            />
            <Label className="text-white/80">Publish immediately</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(26,107,26,0.1)]">
            <Button
              type="button"
              variant="outline"
              className="border-[rgba(26,107,26,0.3)] text-white/70 hover:bg-white/5"
              onClick={() => setCourseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCourse.isPending}
              className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white"
            >
              {createCourse.isPending ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </Modal>

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
    </DashboardLayout>
  );
}
