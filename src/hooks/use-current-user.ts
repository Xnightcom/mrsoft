import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "student" | "instructor" | "client";

export function useCurrentUser() {
  const [state, setState] = useState<{
    loading: boolean;
    userId: string | null;
    email: string | null;
    fullName: string | null;
    roles: AppRole[];
  }>({ loading: true, userId: null, email: null, fullName: null, roles: [] });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setState(s => ({ ...s, loading: false })); return; }
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (!active) return;
      setState({
        loading: false,
        userId: user.id,
        email: user.email ?? null,
        fullName: profile?.full_name ?? user.email ?? null,
        roles: (roles ?? []).map(r => r.role as AppRole),
      });
    })();
    return () => { active = false; };
  }, []);

  return state;
}

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("instructor")) return "instructor";
  if (roles.includes("client")) return "client";
  return "student";
}
