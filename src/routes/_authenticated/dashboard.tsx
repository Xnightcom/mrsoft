import React from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

// Minimal redirect without any loading spinners to avoid infinite loops
function DashboardRedirect() {
  return <Navigate to="/dashboard/client" replace />;
}
