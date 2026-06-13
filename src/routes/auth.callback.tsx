import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * /auth/callback
 *
 * Supabase redirects here after completing the Google OAuth flow.
 * The URL will contain either:
 *   - A PKCE "code" query-param  → we exchange it for a session via exchangeCodeForSession()
 *   - A legacy hash fragment with access_token/refresh_token (implicit flow)
 *     → supabase-js handles this automatically on the next getSession() call.
 *
 * After the session is established we forward the user to /dashboard.
 *
 * ⚠️  This URL MUST be listed in:
 *   1. Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
 *      Add:  http://localhost:8084/auth/callback
 *   2. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client
 *      → Authorized redirect URIs  →  https://<project>.supabase.co/auth/v1/callback
 *      (Supabase handles the Google ↔ Supabase leg; your app only needs the Supabase → app leg above.)
 */
export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        // PKCE flow — exchange the one-time code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[auth/callback] exchangeCodeForSession error:", error);
          toast.error("Sign-in failed: " + error.message);
          navigate({ to: "/auth" });
          return;
        }
      } else {
        // Implicit / hash flow — supabase-js picks it up automatically from location.hash;
        // just wait a tick for the internal listener to fire.
        await supabase.auth.getSession();
      }

      const { data: { session } } = await supabase.auth.getSession();
      let targetPath = "/dashboard/client";
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_suspended, suspended_reason")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.is_suspended) {
          await supabase.auth.signOut();
          navigate({ 
            to: '/auth',
            search: { 
              error: 'suspended',
              reason: profile.suspended_reason 
            }
          });
          return;
        }
        
        if (profile?.role === "admin") {
          targetPath = "/dashboard/admin";
        } else if (profile?.role === "instructor") {
          targetPath = "/dashboard/instructor";
        } else if (profile?.role === "student") {
          targetPath = "/dashboard/student";
        } else if (profile?.role === "client") {
          targetPath = "/dashboard/client";
        }
      }

      navigate({ to: targetPath });
    };

    handle();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
      </div>
    </div>
  );
}
