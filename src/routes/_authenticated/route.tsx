import React from "react";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      // Race getUser against a 3s timeout — never hang on auth check
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error("auth_timeout")), 3000),
      );

      const { data, error } = await Promise.race([
        userPromise,
        timeoutPromise,
      ]);

      if (error || !data.user) throw redirect({ to: "/auth" });
      return { user: data.user };
    } catch (err: any) {
      // If it's already a redirect, re-throw it
      if (err?.to === "/auth" || err?.redirect) throw err;
      // Timeout or unexpected error — redirect to auth
      console.error("[_authenticated] Auth check failed:", err);
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
  errorComponent: AuthErrorFallback,
});

function AuthenticatedLayout() {
  return <Outlet />;
}

function AuthErrorFallback({ error }: { error: Error }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060606]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-[#CC0000]/10 p-4">
          <svg
            className="h-8 w-8 text-[#CC0000]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white">
          Something went wrong
        </h2>
        <p className="max-w-sm text-sm text-white/50">
          {error?.message || "Failed to load dashboard. Please try signing in again."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate({ to: "/auth", replace: true })}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Back to sign in
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#CC0000] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#CC0000]/80"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
