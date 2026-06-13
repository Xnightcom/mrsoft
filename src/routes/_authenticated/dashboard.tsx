import React from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      throw redirect({ to: '/dashboard/client' })
    }
  },
  component: () => <Outlet />
});
