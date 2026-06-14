import React, { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Modal } from "@/components/dashboard/Modal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { Users, GraduationCap, Mail, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/auth' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    const role = profile?.role || 'client'
    if (role !== 'admin') {
      throw redirect({ to: `/dashboard/${role}` as any })
    }
  },
  component: AdminOverview,
});

interface ServiceRequest {
  id: string;
  name: string;
  email: string;
  service: string;
  budget: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

function AdminOverview() {
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: async () => {
      const [usersCount, studentsCount, requestsCount, projectsCount] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("projects").select("id", { count: "exact", head: true }),
      ]);

      return {
        totalUsers: usersCount.count ?? 0,
        activeStudents: studentsCount.count ?? 0,
        pendingRequests: requestsCount.count ?? 0,
        activeProjects: projectsCount.count ?? 0,
      };
    },
  });

  const { data: recentRequests = [], isLoading: tableLoading } = useQuery({
    queryKey: ["admin-recent-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ServiceRequest[];
    },
  });

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "service", header: "Service" },
    {
      key: "status",
      header: "Status",
      render: (item: ServiceRequest) => <StatusBadge status={item.status} />,
    },
    {
      key: "created_at",
      header: "Date",
      render: (item: ServiceRequest) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: "action",
      header: "Action",
      render: (item: ServiceRequest) => (
        <Button
          size="sm"
          className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRequest(item);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <AnnouncementBanner />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-white/50 text-sm mt-1">
            System status, metrics, and activity.
          </p>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-white/5 animate-pulse border border-[rgba(26,107,26,0.3)]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={Users}
              color="blue"
              index={0}
            />
            <StatCard
              title="Active Students"
              value={stats?.activeStudents ?? 0}
              icon={GraduationCap}
              color="green"
              index={1}
            />
            <StatCard
              title="Pending Requests"
              value={stats?.pendingRequests ?? 0}
              icon={Mail}
              color="yellow"
              index={2}
            />
            <StatCard
              title="Active Projects"
              value={stats?.activeProjects ?? 0}
              icon={Briefcase}
              color="red"
              index={3}
            />
          </div>
        )}

        {/* Recent Activity Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white tracking-wide">Recent Service Requests</h3>
          {tableLoading ? (
            <div className="h-64 rounded-xl bg-white/5 animate-pulse border border-[rgba(26,107,26,0.3)]" />
          ) : (
            <DataTable columns={columns} data={recentRequests} />
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Service Request Details"
      >
        {selectedRequest && (
          <div className="space-y-4 text-sm text-white/90">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/50">Client Name</p>
                <p className="font-semibold text-white mt-1">{selectedRequest.name}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Email</p>
                <p className="font-semibold text-white mt-1">{selectedRequest.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/50">Service Requested</p>
                <p className="font-semibold text-white mt-1">{selectedRequest.service}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Budget Estimate</p>
                <p className="font-semibold text-white mt-1">
                  {selectedRequest.budget ? selectedRequest.budget : "Not Specified"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-white/50">Details / Description</p>
              <div className="mt-1 bg-black/30 border border-[rgba(26,107,26,0.2)] rounded-lg p-3 max-h-40 overflow-y-auto text-white/80 whitespace-pre-wrap">
                {selectedRequest.description ?? "No description provided."}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(26,107,26,0.1)]">
              <Button
                variant="outline"
                className="border-[rgba(26,107,26,0.3)] text-[#1A6B1A] hover:bg-[#1A6B1A]/10 hover:text-white"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
