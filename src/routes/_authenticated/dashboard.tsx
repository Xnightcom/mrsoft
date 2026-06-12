import React, { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { role, loading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (role === "admin") {
      navigate({ to: "/dashboard/admin", replace: true });
    } else if (role === "student") {
      navigate({ to: "/dashboard/student", replace: true });
    } else {
      // Default / fallback
      navigate({ to: "/dashboard/client", replace: true });
    }
  }, [role, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060606]">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#CC0000] border-t-transparent" />
        <p className="text-sm text-white/50">Redirecting to your dashboard…</p>
      </div>
    </div>
  );
}
