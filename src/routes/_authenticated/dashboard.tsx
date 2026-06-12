import React, { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initDashboard() {
      try {
        // Step 1: get session with hard 3s timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error("timeout")), 3000),
        );

        const { data: sessionData } = (await Promise.race([
          sessionPromise,
          timeoutPromise,
        ])) as any;

        if (!mounted) return;

        // Step 2: no session → go to login
        if (!sessionData?.session?.user) {
          navigate({ to: "/auth", replace: true });
          return;
        }

        const user = sessionData.session.user;

        // Step 3: fetch profile with maybeSingle
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        // Step 4: if no profile row, create it now
        if (!profile) {
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              full_name:
                user.user_metadata?.full_name ?? user.email ?? "User",
              avatar_url: user.user_metadata?.avatar_url ?? null,
              role: "client",
            },
            { onConflict: "id" },
          );

          if (!mounted) return;
          // Default to client dashboard
          navigate({ to: "/dashboard/client", replace: true });
          return;
        }

        // Step 5: redirect based on role
        if (!mounted) return;
        const role = profile.role ?? "client";

        // Check if already on the correct dashboard
        if (window.location.pathname.includes(`/dashboard/${role}`)) {
          setReady(true);
          return;
        }

        if (role === "admin") {
          navigate({ to: "/dashboard/admin", replace: true });
        } else if (role === "student") {
          navigate({ to: "/dashboard/student", replace: true });
        } else {
          navigate({ to: "/dashboard/client", replace: true });
        }
      } catch (err) {
        // ANY error or timeout → just go to client dashboard
        console.error("[DashboardRedirect] Error:", err);
        if (mounted) {
          navigate({ to: "/dashboard/client", replace: true });
        }
      }
    }

    initDashboard();

    // HARD FALLBACK: redirect after 4s no matter what
    const hardFallback = setTimeout(() => {
      if (mounted) {
        navigate({ to: "/dashboard/client", replace: true });
      }
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(hardFallback);
    };
  }, [navigate]);

  // Show timeout buttons after 5s
  useEffect(() => {
    const timer = setTimeout(() => setShowTimeout(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (ready) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060606]">
      <div className="flex flex-col items-center gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#CC0000] border-t-transparent" />
        <p className="text-sm text-white/50">Loading your dashboard…</p>

        {showTimeout && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-xs text-white/40">Taking too long?</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate({ to: "/auth", replace: true })}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Back to sign in
              </button>
              <button
                onClick={() => setReady(true)}
                className="rounded-lg bg-[#CC0000] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#CC0000]/80"
              >
                Enter dashboard anyway
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
