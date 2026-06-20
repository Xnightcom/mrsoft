import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Video } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard/student/attendance")({
  component: StudentAttendancePage,
});

interface AttendanceRecord {
  id: string;
  session_date: string;
  attended: boolean;
  course: {
    title: string;
  } | null;
}

function StudentAttendancePage() {
  const { profile } = useProfile();
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // 1. Fetch Student Attendance records
  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["student-attendance-list", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `
          id,
          session_date,
          attended,
          course_id
        `,
        )
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
        course: a.course_id ? { title: coursesMap[a.course_id] || "Course" } : null,
      })) as unknown as AttendanceRecord[];
    },
    enabled: !!profile?.id,
  });

  // Calculate stats
  const totalSessions = attendance.length;
  const attendedSessions = attendance.filter((a) => a.attended).length;
  const attendanceRate =
    totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;

  // Calendar dates generation
  const startMonth = startOfMonth(currentMonthDate);
  const endMonth = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({ start: startMonth, end: endMonth });

  const prevMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1),
    );
  };

  // Mock list of upcoming live sessions
  const mockUpcomingLive = [
    {
      id: "live-1",
      title: "Interactive Q&A: Fullstack Database Architecture",
      instructor: "T. Biking David",
      date: "June 25, 2026",
      time: "10:00 AM - 12:00 PM (GMT+1)",
      url: "https://zoom.us/join",
    },
    {
      id: "live-2",
      title: "React 19 & Next.js App Router Review Session",
      instructor: "MRsoft Engineering",
      date: "July 02, 2026",
      time: "02:00 PM - 04:30 PM (GMT+1)",
      url: "https://meet.google.com/abc-def-ghi",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Tracker</h1>
          <p className="text-white/50 text-sm mt-1">
            Track your lecture attendances, session dates, and launch live classrooms.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Calendar View */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(26,107,26,0.2)] pb-4">
              <h3 className="text-lg font-bold text-white tracking-wide">
                Calendar — {format(currentMonthDate, "MMMM yyyy")}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-white/5 border border-white/10 rounded-lg transition-colors text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-white/5 border border-white/10 rounded-lg transition-colors text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
              <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-y-6 text-center text-xs">
                  {/* Days of week */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-white/40 font-semibold uppercase tracking-wider">
                      {day}
                    </div>
                  ))}

                  {/* Empty spaces for alignment of first day */}
                  {Array.from({ length: startMonth.getDay() }).map((_, idx) => (
                    <div key={`empty-${idx}`} />
                  ))}

                  {/* Days of month */}
                  {daysInMonth.map((day) => {
                    // Find attendance record for this day
                    const record = attendance.find((a) => {
                      const recordDate = parseISO(a.session_date);
                      return isSameDay(recordDate, day);
                    });

                    let dotColor = "bg-gray-700/60";
                    if (record) {
                      dotColor = record.attended
                        ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e]"
                        : "bg-[#ef4444] shadow-[0_0_6px_#ef4444]";
                    }

                    return (
                      <div
                        key={day.toString()}
                        className="relative flex flex-col items-center group py-1"
                      >
                        <span className="text-sm font-semibold text-white/95">{day.getDate()}</span>
                        <span className={`h-1.5 w-1.5 rounded-full mt-1.5 ${dotColor}`} />

                        {/* Hover Tooltip */}
                        {record && (
                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block w-36 bg-[#060606] border border-white/10 text-[10px] text-white p-2 rounded-lg text-left shadow-lg">
                            <p className="font-bold">{record.course?.title ?? "Course Session"}</p>
                            <p className="mt-1 text-white/50">
                              {record.attended ? "Attended" : "Absent"}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats & Live Classes */}
          <div className="space-y-6">
            {/* Stat Card */}
            <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
              <CardContent className="p-6 space-y-4">
                <div>
                  <span className="text-xs text-white/50 font-medium uppercase">
                    Overall Attendance
                  </span>
                  <h3 className="text-3xl font-bold text-white mt-1">{attendanceRate}%</h3>
                </div>
                <div className="space-y-2.5 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" /> Attended Sessions
                    </span>
                    <strong className="text-white">{attendedSessions}</strong>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2">
                    <span className="flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-[#ef4444]" /> Absent Sessions
                    </span>
                    <strong className="text-white">{totalSessions - attendedSessions}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Live Sessions */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white tracking-wide">Upcoming Live Sessions</h3>
              <div className="space-y-3">
                {mockUpcomingLive.map((live) => (
                  <div
                    key={live.id}
                    className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-4 space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] bg-red-950/40 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 w-fit">
                        <Video className="h-3 w-3" /> Live
                      </span>
                      <h4 className="font-bold text-white text-xs mt-1.5">{live.title}</h4>
                      <p className="text-[10px] text-white/50">
                        {live.instructor} · {live.date}
                      </p>
                      <p className="text-[10px] text-white/40">{live.time}</p>
                    </div>
                    <a
                      href={live.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-full rounded-lg bg-[#CC0000] hover:bg-[#CC0000]/80 text-white font-bold text-xs py-2 transition-colors"
                    >
                      Join Classroom
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
