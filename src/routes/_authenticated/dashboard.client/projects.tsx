import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import {
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle2,
  Circle,
  MessageSquare,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/client/projects")({
  component: ClientProjectsPage,
});

interface Milestone {
  id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
}

interface ProjectData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  assigned_to: string | null;
  developer: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  milestones: Milestone[];
}

function ClientProjectsPage() {
  const { profile } = useProfile();
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // Fetch Projects, Developers, and Milestones
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["client-projects-list", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data: projectsData, error: pErr } = await supabase
        .from("projects")
        .select(
          `
          id,
          title,
          description,
          status,
          deadline,
          assigned_to
        `,
        )
        .eq("client_id", profile.id);

      if (pErr) throw pErr;

      const devIds = projectsData.map((p: any) => p.assigned_to).filter(Boolean);
      const projectIds = projectsData.map((p: any) => p.id);

      const devsMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (devIds.length > 0) {
        const { data: devsData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", devIds);
        if (devsData) {
          devsData.forEach((d: any) => {
            devsMap[d.id] = { full_name: d.full_name, avatar_url: d.avatar_url };
          });
        }
      }

      const milestonesMap: Record<string, Milestone[]> = {};
      if (projectIds.length > 0) {
        const { data: milestoneData } = await supabase
          .from("milestones")
          .select("id, project_id, title, due_date, is_completed")
          .in("project_id", projectIds)
          .order("due_date", { ascending: true });
        if (milestoneData) {
          milestoneData.forEach((m: any) => {
            if (!milestonesMap[m.project_id]) {
              milestonesMap[m.project_id] = [];
            }
            milestonesMap[m.project_id].push({
              id: m.id,
              title: m.title,
              due_date: m.due_date,
              is_completed: m.is_completed,
            });
          });
        }
      }

      return projectsData.map((p: any) => ({
        ...p,
        developer: p.assigned_to ? devsMap[p.assigned_to] || null : null,
        milestones: milestonesMap[p.id] || [],
      })) as unknown as ProjectData[];
    },
    enabled: !!profile?.id,
  });

  const mockDeliverables = [
    {
      name: "Product Design Specification (SRS)",
      size: "2.4 MB",
      format: "PDF",
      url: "#",
    },
    {
      name: "Figma High-Fidelity UI Prototype",
      size: "External Link",
      format: "Figma",
      url: "https://figma.com",
    },
    {
      name: "Alpha Build Package",
      size: "45.8 MB",
      format: "ZIP",
      url: "#",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {selectedProject ? (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Projects
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(26,107,26,0.2)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#CC0000] uppercase tracking-wider">
                    Project File
                  </span>
                  <StatusBadge status={selectedProject.status} />
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedProject.title}</h2>
                <p className="text-xs text-white/60 mt-1">{selectedProject.description}</p>
              </div>

              {selectedProject.developer && (
                <div className="flex items-center gap-3 bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-3">
                  <img
                    src={
                      selectedProject.developer.avatar_url ??
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    }
                    alt={selectedProject.developer.full_name ?? "Dev"}
                    className="h-9 w-9 rounded-full object-cover border border-white/5"
                  />
                  <div>
                    <p className="text-[10px] text-white/40 uppercase">Assigned Team</p>
                    <p className="text-xs font-semibold text-white">
                      {selectedProject.developer.full_name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-bold text-white tracking-wide">Project Milestones</h3>
                <div className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-6 relative">
                  {selectedProject.milestones.length === 0 ? (
                    <div className="text-center py-6 text-white/40 text-xs">
                      No milestones mapped to this project yet.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-[rgba(26,107,26,0.3)] pl-6 space-y-6">
                      {selectedProject.milestones.map((m) => (
                        <div key={m.id} className="relative">
                          <span className="absolute -left-[31px] top-0.5 bg-[#0F0F0F] rounded-full p-0.5 z-10">
                            {m.is_completed ? (
                              <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                            ) : (
                              <Circle className="h-5 w-5 text-white/30 bg-[#0F0F0F]" />
                            )}
                          </span>

                          <div className="space-y-1">
                            <h4
                              className={`text-sm font-semibold ${m.is_completed ? "text-white/60 line-through" : "text-white"}`}
                            >
                              {m.title}
                            </h4>
                            {m.due_date && (
                              <p className="text-[10px] text-white/40 flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-white/30" />
                                Target date: {new Date(m.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white tracking-wide">Deliverable Assets</h3>
                <div className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-4 space-y-3">
                  {mockDeliverables.map((deliv, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#060606] border border-white/5 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{deliv.name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {deliv.size} · {deliv.format}
                        </p>
                      </div>
                      <a
                        href={deliv.url}
                        target={deliv.format === "Figma" ? "_blank" : undefined}
                        rel={deliv.format === "Figma" ? "noreferrer" : undefined}
                        className="text-white/60 hover:text-[#CC0000] p-1.5 hover:bg-white/5 rounded transition-all shrink-0"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Project Board</h1>
              <p className="text-white/50 text-sm mt-1">
                Track ongoing projects, deadlines, assignments, and check milestones.
              </p>
            </div>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/50 text-sm">
                No projects active. Submit a service request to initiate a project.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] hover:border-[#CC0000]/50 rounded-xl p-5 flex flex-col justify-between hover:shadow-[0_0_15px_rgba(204,0,0,0.15)] transition-all duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <h4 className="font-bold text-white text-base truncate">{project.title}</h4>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="text-white/60 text-xs line-clamp-3">{project.description}</p>
                      {project.deadline && (
                        <p className="text-[10px] text-white/40 flex items-center gap-1.5 pt-1">
                          <Calendar className="h-3.5 w-3.5 text-white/30" />
                          Target Deadline: {new Date(project.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                      {project.developer ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              project.developer.avatar_url ??
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                            }
                            alt={project.developer.full_name ?? "Dev"}
                            className="h-6 w-6 rounded-full object-cover border border-white/5"
                          />
                          <span className="text-[10px] text-white/60 font-semibold truncate max-w-[100px]">
                            {project.developer.full_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/30">Awaiting Dev</span>
                      )}

                      <Button
                        size="sm"
                        className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white font-bold text-[10px] px-3 py-1.5"
                        onClick={() => setSelectedProject(project)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
