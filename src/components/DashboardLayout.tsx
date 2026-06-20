import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";
import {
  Cpu,
  LogOut,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Award,
  CreditCard,
  User,
  Users,
  Mail,
  Settings,
  Shield,
  Briefcase,
  Megaphone,
} from "lucide-react";
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
    { to: "/dashboard/admin/requests", label: "Service Requests", icon: Mail },
    { to: "/dashboard/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/dashboard/admin/students", label: "Students", icon: Users },
    { to: "/dashboard/admin/courses", label: "Courses", icon: GraduationCap },
    { to: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ],
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profileApproved, setProfileApproved] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user.userId) return;
    const checkSuspension = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_suspended, suspended_reason, is_approved, role")
        .eq("id", user.userId)
        .maybeSingle();

      console.log("Dashboard init - user:", user.userId);
      console.log("Profile loaded:", profile);
      console.log("is_suspended:", profile?.is_suspended);
      console.log("is_approved:", profile?.is_approved);
      console.log("role:", profile?.role);

      if (profile) {
        setProfileApproved(profile.is_approved !== false);
      }

      if (profile?.is_suspended) {
        router.navigate({
          to: "/auth",
          search: {
            error: "suspended",
            reason:
              profile.suspended_reason ??
              "Your account has been suspended. Contact tambikingdavid@gmail.com",
          } as any,
        });
        await supabase.auth.signOut();
        queryClient.clear();
      }
    };
    checkSuspension();
  }, [user.userId, router, queryClient]);

  const role = primaryRole(user.roles);
  const items = navByRole[role];

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth", replace: true });
  };

  if (profileApproved === false) {
    const handleSignOut = async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Signed out");
      router.navigate({ to: "/auth", replace: true });
    };

    return (
      <div className="min-h-screen bg-[#060606] text-white font-sans flex flex-col relative">
        <header className="h-[60px] border-b border-white/10 flex items-center px-6">
          <img
            src="/mrsoft-logo.png"
            alt="MRsoft"
            className="h-8 object-contain mix-blend-screen"
          />
        </header>
        <div style={{ position: "relative", flex: 1 }}>
          <div
            style={{
              filter: "grayscale(100%) opacity(0.3)",
              pointerEvents: "none",
              userSelect: "none",
              height: "100%",
            }}
          >
            <div className="p-8">
              <div className="h-64 w-full bg-white/5 rounded-xl mb-4"></div>
              <div className="h-32 w-full max-w-md bg-white/5 rounded-xl"></div>
            </div>
          </div>

          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(6,6,6,0.85)",
              backdropFilter: "blur(8px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#0F0F0F",
                border: "1px solid rgba(245,158,11,0.4)",
                borderRadius: 16,
                padding: 48,
                maxWidth: 480,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  marginBottom: 24,
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                ⏳
              </div>

              <h2
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Awaiting Admin Approval
              </h2>

              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Your account is being reviewed by our admin team. You'll receive an email
                notification once approved and will get full access to all features.
              </p>

              <div
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                  color: "rgba(245,158,11,0.9)",
                  fontSize: 14,
                }}
              >
                📧 Check your email for a confirmation link if you haven't verified yet.
              </div>

              <button
                onClick={handleSignOut}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.6)",
                  padding: "10px 24px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <aside
        className="w-64 bg-[#060606] text-white flex flex-col fixed inset-y-0 z-30 hidden md:flex"
        style={{ borderRight: "1px solid rgba(26,107,26,0.3)" }}
      >
        <div
          className="p-5 flex justify-start"
          style={{ borderBottom: "1px solid rgba(26,107,26,0.3)" }}
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center transition-transform duration-300 hover:scale-[1.03]"
          >
            <img
              src="/mrsoft-logo-new.png"
              alt="MRsoft Logo"
              className="object-contain logo-blend sidebar-logo"
              style={{
                height: 36,
                width: "auto",
                mixBlendMode: "screen",
                background: "transparent",
                filter: "contrast(1.1) brightness(1.05)",
                border: "none",
                boxShadow: "none",
              }}
            />
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm sidebar-link ${active ? "sidebar-link-active font-semibold" : "text-white/70 hover:text-white"}`}
              >
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
            <div className="text-xs text-white/50 capitalize flex items-center gap-1 mt-1">
              <Shield className="h-3 w-3" /> {role}
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/70 hover:bg-white/5 hover:text-white sidebar-signout-btn"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 min-w-0">
        <div
          className="md:hidden flex items-center justify-between p-4 bg-[#060606]"
          style={{ borderBottom: "1px solid rgba(26,107,26,0.3)" }}
        >
          <Link to="/" className="flex items-center">
            <img
              src="/mrsoft-logo-new.png"
              alt="MRsoft Logo"
              className="object-contain logo-blend sidebar-logo"
              style={{
                height: 36,
                width: "auto",
                mixBlendMode: "screen",
                background: "transparent",
                filter: "contrast(1.1) brightness(1.05)",
                border: "none",
                boxShadow: "none",
              }}
            />
          </Link>
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="text-white sidebar-signout-btn"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </main>
    </div>
  );
}
