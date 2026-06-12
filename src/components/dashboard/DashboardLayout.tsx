import React, { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";
import {
  LayoutDashboard,
  Users,
  Mail,
  GraduationCap,
  BookOpen,
  BarChart3,
  Settings,
  ClipboardList,
  Calendar,
  Award,
  Megaphone,
  User,
  Briefcase,
  Receipt,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
}

const adminLinks: NavItem[] = [
  { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/admin/users", label: "Users", icon: Users },
  { to: "/dashboard/admin/requests", label: "Service Requests", icon: Mail },
  { to: "/dashboard/admin/students", label: "Students", icon: GraduationCap },
  { to: "/dashboard/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

const studentLinks: NavItem[] = [
  { to: "/dashboard/student", label: "My Learning", icon: LayoutDashboard },
  { to: "/dashboard/student/courses", label: "My Courses", icon: BookOpen },
  { to: "/dashboard/student/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/dashboard/student/attendance", label: "Attendance", icon: Calendar },
  { to: "/dashboard/student/certificates", label: "Certificates", icon: Award },
  { to: "/dashboard/student/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/student/profile", label: "Profile", icon: User },
];

const clientLinks: NavItem[] = [
  { to: "/dashboard/client", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/client/projects", label: "My Projects", icon: Briefcase },
  { to: "/dashboard/client/requests", label: "Service Requests", icon: Mail },
  { to: "/dashboard/client/invoices", label: "Invoices", icon: Receipt },
  { to: "/dashboard/client/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/client/profile", label: "Profile", icon: User },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, role, loading } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const signOut = async () => {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      navigate({ to: "/auth", replace: true });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const links =
    role === "admin"
      ? adminLinks
      : role === "student"
      ? studentLinks
      : clientLinks;

  // Determine current page title
  const activeLink = links.find(
    (item) => pathname === item.to || pathname.startsWith(item.to + "/")
  );
  const pageTitle = activeLink ? activeLink.label : "Dashboard";

  // Badge configuration based on role
  const badgeStyle = {
    admin: "bg-[#CC0000] text-white",
    student: "bg-[#1A6B1A] text-white",
    client: "bg-[#1A3A6B] text-white",
  }[role ?? "client"];

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-[#0A0A0A] text-white">
      <div>
        {/* Top MRsoft Logo */}
        <div className="flex h-[60px] items-center border-b border-[rgba(26,107,26,0.3)] px-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center transition-transform duration-300 hover:scale-[1.03]"
          >
            <img
              src="/mrsoft-logo-new.png"
              alt="MRsoft Logo"
              className="h-8 w-auto object-contain logo-blend mix-blend-screen"
            />
          </Link>
        </div>

        {/* User Card */}
        {profile && (
          <div className="flex items-center gap-3 border-b border-[rgba(26,107,26,0.3)] p-4">
            <img
              src={profile.avatar_url ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
              alt={profile.full_name ?? "User"}
              className="h-10 w-10 rounded-full border border-[rgba(26,107,26,0.5)] object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {profile.full_name ?? "MRsoft Member"}
              </p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badgeStyle}`}>
                {role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="mt-4 space-y-1 px-3">
          {links.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#CC0000]/15 text-white border-l-3 border-[#CC0000] font-semibold"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-[#CC0000]" : "text-white/50 group-hover:text-white"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div className="border-t border-[rgba(26,107,26,0.3)] p-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="fixed inset-y-0 left-0 z-30 w-[240px] border-r border-[rgba(26,107,26,0.3)] hidden md:block">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer content */}
          <aside className="fixed inset-y-0 left-0 z-50 w-[240px] border-r border-[rgba(26,107,26,0.3)] animate-in slide-in-from-left duration-250">
            {renderSidebarContent()}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-white/70 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col md:pl-[240px]">
        {/* Fixed Topbar */}
        <header className="sticky top-0 z-20 flex h-[60px] w-full items-center justify-between border-b border-[rgba(26,107,26,0.3)] bg-gradient-to-r from-[#060606] to-[#0A0A0A] px-6 backdrop-blur-[4px]">
          {/* Left: Page Title / Mobile menu toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-white hover:text-white/70 focus:outline-none md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-bold tracking-wider text-white md:text-xl">
              {pageTitle}
            </h2>
          </div>

          {/* Right: Notifications & Profile Dropdown */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            {/* Profile Dropdown */}
            {profile && (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-white/5 focus:outline-none"
                >
                  <img
                    src={profile.avatar_url ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                    alt={profile.full_name ?? "User"}
                    className="h-8 w-8 rounded-full border border-[rgba(26,107,26,0.5)] object-cover"
                  />
                  <ChevronDown className="h-4 w-4 text-white/50" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 z-50 w-48 rounded-xl border border-[rgba(26,107,26,0.3)] bg-[#0F0F0F] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                      <Link
                        to={role === "admin" ? "/dashboard/admin/settings" : `/dashboard/${role}/profile`}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="min-h-[calc(100vh-60px)] p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
