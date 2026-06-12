import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Calendar, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/student/announcements")({
  component: StudentAnnouncementsPage,
});

function StudentAnnouncementsPage() {
  const announcements = [
    {
      id: 1,
      title: "Vercel Auto-Deployment Complete & Supabase RLS Synced",
      author: "Admin Team",
      date: "June 12, 2026",
      content: "We have finalized migrations for the three-role dashboard systems. Student, Client, and Admin roles are now isolated via Supabase Row-Level Security checks. All tables and real-time messaging are functional.",
    },
    {
      id: 2,
      title: "ICT Training Program Enrollment Cycles Open",
      author: "Education Coordinator",
      date: "June 08, 2026",
      content: "Students looking to register for additional Advanced Frontend, Web3 Development, or Systems Engineering programs can schedule course reviews with the administrative desk. Practical certifications are issued upon completing the sequence.",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-white/50 text-sm mt-1">Platform updates, notice sheets, and system news.</p>
        </div>

        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="space-y-1">
                  <span className="text-[10px] bg-[#CC0000]/10 border border-[#CC0000]/20 text-[#CC0000] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 w-fit">
                    <Megaphone className="h-3.5 w-3.5" /> Notice
                  </span>
                  <CardTitle className="text-base font-bold text-white mt-1.5">{ann.title}</CardTitle>
                </div>
                <div className="text-right text-[10px] text-white/40 shrink-0">
                  <span className="flex items-center gap-1 justify-end"><Calendar className="h-3.5 w-3.5" /> {ann.date}</span>
                  <span className="flex items-center gap-1 justify-end mt-1"><User className="h-3.5 w-3.5" /> {ann.author}</span>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-white/70 leading-relaxed text-justify pt-2">
                {ann.content}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
