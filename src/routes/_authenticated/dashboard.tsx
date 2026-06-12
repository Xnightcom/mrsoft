import React, { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { role, loading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const hasRedirected = useRef(false);

  // Safety timeout — if loading never resolves, force fallback after 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect based on role
  useEffect(() => {
    if (hasRedirected.current) return;

    // Only redirect from the exact /dashboard path — not from sub-routes
    const currentPath = location.pathname;
    if (currentPath !== "/dashboard" && currentPath !== "/dashboard/") return;

    if (loading && !timedOut) return;

    hasRedirected.current = true;

    if (role === "admin") {
      navigate({ to: "/dashboard/admin", replace: true });
    } else if (role === "student") {
      navigate({ to: "/dashboard/student", replace: true });
    } else {
      // Default / fallback — client
      navigate({ to: "/dashboard/client", replace: true });
    }
  }, [role, loading, timedOut, navigate, location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060606]">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#CC0000] border-t-transparent" />
        <p className="text-sm text-white/50">
          {timedOut ? "Almost there…" : "Redirecting to your dashboard…"}
        </p>
      </div>
    </div>
  );
}
