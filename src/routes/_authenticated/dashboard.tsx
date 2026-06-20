import React from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === "/dashboard" || location.pathname === "/dashboard/") {
      const user = context.user;
      if (!user) throw redirect({ to: "/auth" });

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = profile?.role || "client";
      throw redirect({ to: `/dashboard/${role}` as any });
    }
  },
  component: () => <Outlet />,
});
