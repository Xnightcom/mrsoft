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
    <div className="min-h-screen flex w-full">
      <aside className="w-64 bg-[#060606] text-white flex flex-col fixed inset-y-0 z-30 hidden md:flex" style={{ borderRight: "1px solid rgba(26,107,26,0.3)" }}>
        <div className="p-5 flex justify-start" style={{ borderBottom: "1px solid rgba(26,107,26,0.3)" }}>
          <Link to="/" className="inline-flex items-center justify-center transition-transform duration-300 hover:scale-[1.03]">
            <img
              src="/mrsoft-logo-new.png"
              alt="MRsoft Logo"
              className="object-contain logo-blend"
              style={{
                height: 36,
                width: "auto",
                mixBlendMode: "screen",
                background: "transparent",
                filter: "contrast(1.1) brightness(1.05)",
                border: "none",
                boxShadow: "none"
              }}
            />
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(item => {
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-smooth ${active ? "bg-[#CC0000]/15 text-white font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3" style={{ borderTop: "1px solid rgba(26,107,26,0.3)" }}>
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-white/50">Signed in as</div>
            <div className="text-sm font-medium truncate text-white">{user.fullName ?? "—"}</div>
            <div className="text-xs text-white/50 capitalize flex items-center gap-1 mt-1"><Shield className="h-3 w-3" /> {role}</div>
          </div>
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 min-w-0">
        <div className="md:hidden flex items-center justify-between p-4 bg-[#060606]" style={{ borderBottom: "1px solid rgba(26,107,26,0.3)" }}>
          <Link to="/" className="flex items-center">
            <img
              src="/mrsoft-logo-new.png"
              alt="MRsoft Logo"
              className="object-contain logo-blend"
              style={{
                height: 36,
                width: "auto",
                mixBlendMode: "screen",
                background: "transparent",
                filter: "contrast(1.1) brightness(1.05)",
                border: "none",
                boxShadow: "none"
              }}
            />
          </Link>
          <Button onClick={signOut} variant="ghost" size="sm" className="text-white"><LogOut className="h-4 w-4" /></Button>
        </div>
        {children}
      </main>
    </div>
  );
}
