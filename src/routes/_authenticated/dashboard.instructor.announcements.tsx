import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AnnouncementsView } from "@/components/dashboard/AnnouncementsView";

export const Route = createFileRoute("/_authenticated/dashboard/instructor/announcements")({
  component: InstructorAnnouncementsPage,
});

function InstructorAnnouncementsPage() {
  return (
    <DashboardLayout>
      <AnnouncementsView />
    </DashboardLayout>
  );
}
