import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/_authenticated/dashboard/instructor/attendance")({
  component: InstructorAttendancePage,
});

function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
      <div className="flex gap-4 mb-6">
        <div className="h-10 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-10 w-40 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
      </div>
      <div className="h-64 bg-white/5 rounded-xl animate-pulse mt-6" />
    </div>
  );
}

function EmptyState({ icon, title, message }: { icon: string, title: string, message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-white/50">{message}</p>
    </div>
  );
}

function InstructorAttendancePage() {
  return (
    <DashboardLayout>
      <InstructorAttendance />
    </DashboardLayout>
  );
}

function InstructorAttendance() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load instructor courses on mount
  useEffect(() => {
    async function loadCourses() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) return;
      
      const { data } = await supabase
        .from('courses')
        .select('id, title, class_schedule')
        .eq('instructor_id', session.user.id);
      
      setCourses(data ?? []);
      if (data && data.length > 0) {
        setSelectedCourse(data[0].id);
      }
      setLoading(false);
    }
    loadCourses();
  }, []);

  // Load students when course or date changes
  useEffect(() => {
    if (!selectedCourse) return;
    loadStudentsAndAttendance();
  }, [selectedCourse, selectedDate]);

  async function loadStudentsAndAttendance() {
    setLoading(true);
    
    // Get enrolled students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        profiles!enrollments_student_id_fkey (
          id,
          full_name
        )
      `)
      .eq('course_id', selectedCourse);
    
    setStudents(enrollments ?? []);
    
    // Get existing attendance for this date
    const { data: existing } = await supabase
      .from('attendance')
      .select('student_id, attended')
      .eq('course_id', selectedCourse)
      .eq('session_date', selectedDate);
    
    const map: Record<string, boolean> = {};
    existing?.forEach((a: any) => {
      map[a.student_id] = a.attended;
    });
    setAttendance(map);
    setLoading(false);
  }

  function toggleAttendance(studentId: string, attended: boolean) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: attended
    }));
  }

  function markAll(attended: boolean) {
    const map: Record<string, boolean> = {};
    students.forEach((s: any) => {
      map[s.student_id] = attended;
    });
    setAttendance(map);
  }

  async function saveAttendance() {
    if (!selectedCourse || students.length === 0) return;
    setSaving(true);
    
    const records = students.map((s: any) => ({
      student_id: s.student_id,
      course_id: selectedCourse,
      session_date: selectedDate,
      attended: attendance[s.student_id] ?? false
    }));
    
    const { error } = await supabase
      .from('attendance')
      .upsert(records, {
        onConflict: 'student_id,course_id,session_date'
      });
    
    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }

  const presentCount = Object.values(attendance).filter(v => v === true).length;
  const absentCount = Object.values(attendance).filter(v => v === false).length;
  const unmarkedCount = students.length - Object.keys(attendance).length;

  if (loading) return <AttendanceSkeleton />;

  if (courses.length === 0) return (
    <EmptyState 
      icon="📚"
      title="No courses assigned"
      message="Contact admin to be assigned to a course"
    />
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <h1 style={{ 
        color: 'white', fontSize: 24, 
        fontWeight: 700, marginBottom: 24 
      }}>
        Attendance Manager
      </h1>

      {/* Controls row */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        {/* Course selector */}
        <select
          value={selectedCourse ?? ''}
          onChange={e => setSelectedCourse(e.target.value)}
          style={{
            background: '#0F0F0F',
            border: '1px solid rgba(26,107,26,0.4)',
            color: 'white',
            padding: '10px 16px',
            borderRadius: 8,
            flex: 1,
            minWidth: 200,
            cursor: 'pointer'
          }}
        >
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        {/* Date picker */}
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{
            background: '#0F0F0F',
            border: '1px solid rgba(26,107,26,0.4)',
            color: 'white',
            padding: '10px 16px',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 24
      }}>
        {[
          { label: 'Present', value: presentCount, color: '#1A6B1A' },
          { label: 'Absent', value: absentCount, color: '#CC0000' },
          { label: 'Unmarked', value: unmarkedCount, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#0F0F0F',
            border: `1px solid ${s.color}40`,
            borderRadius: 10,
            padding: '16px 20px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              {s.label}
            </p>
            <p style={{ color: s.color, fontSize: 32, fontWeight: 700 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => markAll(true)} style={{
          background: 'rgba(26,107,26,0.15)',
          border: '1px solid rgba(26,107,26,0.4)',
          color: '#4ADE80',
          padding: '8px 16px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13
        }}>
          ✓ Mark All Present
        </button>
        <button onClick={() => markAll(false)} style={{
          background: 'rgba(204,0,0,0.15)',
          border: '1px solid rgba(204,0,0,0.4)',
          color: '#F87171',
          padding: '8px 16px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13
        }}>
          ✗ Mark All Absent
        </button>
      </div>

      {/* Student list */}
      {students.length === 0 ? (
        <EmptyState 
          icon="👥"
          title="No students enrolled"
          message="No students are enrolled in this course yet"
        />
      ) : (
        <div style={{
          background: '#0F0F0F',
          borderRadius: 12,
          border: '1px solid rgba(26,107,26,0.2)',
          overflow: 'hidden',
          marginBottom: 16
        }}>
          {students.map((s: any, i: number) => (
            <div key={s.student_id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: i < students.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              animation: `cardIn 0.3s ease forwards`,
              animationDelay: `${i * 0.04}s`,
              opacity: 0
            }}>
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: '#1A6B1A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14
                }}>
                  {s.profiles?.full_name?.[0] ?? '?'}
                </div>
                <span style={{ color: 'white' }}>
                  {s.profiles?.full_name ?? 'Unknown'}
                </span>
              </div>

              {/* Present / Absent buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => toggleAttendance(s.student_id, true)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: '1px solid #1A6B1A',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    transition: 'all 0.2s ease',
                    background: attendance[s.student_id] === true ? '#1A6B1A' : 'transparent',
                    color: attendance[s.student_id] === true ? 'white' : '#4ADE80',
                  }}
                >
                  ✓ Present
                </button>
                <button
                  onClick={() => toggleAttendance(s.student_id, false)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: '1px solid #CC0000',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    transition: 'all 0.2s ease',
                    background: attendance[s.student_id] === false ? '#CC0000' : 'transparent',
                    color: attendance[s.student_id] === false ? 'white' : '#F87171',
                  }}
                >
                  ✗ Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={saveAttendance}
        disabled={saving || students.length === 0}
        style={{
          width: '100%',
          padding: '14px',
          background: saveSuccess ? '#1A6B1A' : '#CC0000',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving...' 
          : saveSuccess ? '✓ Attendance Saved!' 
          : 'Save Attendance'}
      </button>
    </div>
  );
}
