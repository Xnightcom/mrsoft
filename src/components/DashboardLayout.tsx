import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { Cpu, LogOut, LayoutDashboard, BookOpen, GraduationCap, ClipboardList, Award, CreditCard, User, Users, Mail, Settings, Shield, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, primaryRole, type AppRole } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Item = { to: string; label: string; icon: typeof LayoutDashboard };

const navByRole: Record<AppRole, Item[]> = {
  student: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/courses", label: "My Courses", icon: BookOpen },
    { to: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
    { to: "/dashboard/certificates", label: "Certificates", icon: Award },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ],
  instructor: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/courses", label: "My Courses", icon: BookOpen },
    { to: "/dashboard/assignments", label: "Submissions", icon: ClipboardList },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ],
  client: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/requests", label: "My Requests", icon: Briefcase },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/admin/students", label: "Students", icon: Users },
    { to: "/dashboard/admin/courses", label: "Courses", icon: GraduationCap },
    { to: "/dashboard/admin/requests", label: "Service Requests", icon: Mail },
    { to: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ],
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: s => s.location.pathname });

  const role = primaryRole(user.roles);
  const items = navByRole[role];

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen flex w-full bg-muted/20">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 z-30 hidden md:flex">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg gradient-primary"><Cpu className="h-5 w-5" /></span>
            MRsoft
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(item => {
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-smooth ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-sidebar-foreground/60">Signed in as</div>
            <div className="text-sm font-medium truncate">{user.fullName ?? "—"}</div>
            <div className="text-xs text-sidebar-foreground/60 capitalize flex items-center gap-1 mt-1"><Shield className="h-3 w-3" /> {role}</div>
          </div>
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 min-w-0">
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Link to="/" className="flex items-center gap-2 font-bold"><Cpu className="h-5 w-5 text-primary" /> MRsoft</Link>
          <Button onClick={signOut} variant="ghost" size="sm"><LogOut className="h-4 w-4" /></Button>
        </div>
        {children}
      </main>
    </div>
  );
}
