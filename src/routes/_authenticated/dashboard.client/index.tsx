import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Briefcase, CreditCard, MessageSquare, Plus, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/client/")({
  component: ClientOverviewPage,
});

interface Project {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  milestones: {
    id: string;
    is_completed: boolean;
  }[];
}

function ClientOverviewPage() {
  const { profile } = useProfile();

  // 1. Fetch Client Projects & Milestones
  const { data: projects = [], isLoading: pLoading } = useQuery({
    queryKey: ["client-projects-overview", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data: projectsData, error: pErr } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          status,
          deadline
        `)
        .eq("client_id", profile.id);

      if (pErr) throw pErr;

      const projectIds = projectsData.map(p => p.id);
      let milestonesMap: Record<string, { id: string; is_completed: boolean }[]> = {};
      if (projectIds.length > 0) {
        const { data: milestoneData } = await supabase
          .from("milestones")
          .select("id, project_id, is_completed")
          .in("project_id", projectIds);
        if (milestoneData) {
          milestoneData.forEach(m => {
            if (!milestonesMap[m.project_id]) {
              milestonesMap[m.project_id] = [];
            }
            milestonesMap[m.project_id].push({ id: m.id, is_completed: m.is_completed });
          });
        }
      }

      return projectsData.map((p) => ({
        ...p,
        milestones: milestonesMap[p.id] || [],
      })) as unknown as Project[];
    },
    enabled: !!profile?.id,
  });

  // 2. Fetch Pending Invoices Count
  const { data: invoiceCount = 0, isLoading: iLoading } = useQuery({
    queryKey: ["client-invoices-pending", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("client_id", profile.id)
        .eq("status", "pending");

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  // 3. Fetch Unread Messages Count
  const { data: unreadMessagesCount = 0, isLoading: mLoading } = useQuery({
    queryKey: ["client-unread-messages", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { data: clientProjs } = await supabase
        .from("projects")
        .select("id")
        .eq("client_id", profile.id);
      
      const projectIds = (clientProjs ?? []).map(p => p.id);
      if (!projectIds.length) return 0;

      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
        .eq("is_read", false)
        .not("sender_id", "eq", profile.id);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const activeProjects = projects.filter((p) => p.status !== "delivered");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-[#0F0F0F] via-[#0A0A0A] to-[#060606] border border-[rgba(26,107,26,0.3)] rounded-xl p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg hover:border-[#CC0000]/40 transition-all duration-300">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome back, {profile?.full_name?.split(" ")[0] ?? "Partner"} 👋
            </h1>
            <p className="text-white/50 text-xs mt-1 md:text-sm">
              Review project progress, active billing, and communicate with the engineering desk.
            </p>
          </div>
          <Link to="/contact">
            <Button className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center gap-1.5 text-xs font-bold px-4 py-2">
              <Plus className="h-4 w-4" />
              Submit New Request
            </Button>
          </Link>
        </div>

        {pLoading || iLoading || mLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Active Projects"
              value={activeProjects.length}
              icon={Briefcase}
              color="red"
            />
            <StatCard
              title="Pending Invoices"
              value={invoiceCount}
              icon={CreditCard}
              color="yellow"
            />
            <StatCard
              title="Unread Messages"
              value={unreadMessagesCount}
              icon={MessageSquare}
              color="blue"
            />
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white tracking-wide">Ongoing Engagements</h3>
          {pLoading ? (
            <div className="h-48 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse" />
          ) : activeProjects.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-white/40 text-xs">
              No active projects ongoing. Get started by submitting a request.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeProjects.map((project) => {
                const totalM = project.milestones.length;
                const completedM = project.milestones.filter((m) => m.is_completed).length;
                const progressPercent = totalM > 0 ? Math.round((completedM / totalM) * 100) : 0;

                return (
                  <div
                    key={project.id}
                    className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-5 flex flex-col justify-between hover:border-[#CC0000]/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(204,0,0,0.1)]"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <h4 className="font-bold text-white text-base truncate">{project.title}</h4>
                        <StatusBadge status={project.status} />
                      </div>

                      <ProgressBar value={progressPercent} color="green" showLabel={true} />

                      {project.deadline && (
                        <p className="text-[10px] text-white/40">
                          Target Deadline: <strong className="text-white/60">{new Date(project.deadline).toLocaleDateString()}</strong>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                      <Link to="/dashboard/client/projects">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[rgba(26,107,26,0.3)] text-[#1A6B1A] hover:bg-[#1A6B1A]/10 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          View Milestones & Deliverables
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
