import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Modal } from "@/components/dashboard/Modal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Plus, CheckCircle, Circle, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/client/requests")({
  component: ClientRequestsPage,
});

interface ServiceRequest {
  id: string;
  service: string;
  budget: string | null;
  status: string;
  created_at: string;
  description: string | null;
}

const PIPELINE_STAGES = ["pending", "reviewed", "in_progress", "completed"];

function ClientRequestsPage() {
  const { profile } = useProfile();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["client-service-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as ServiceRequest[]).map((r) => {
        let status = r.status.toLowerCase();
        if (status === "new") status = "pending";
        if (status === "contacted") status = "reviewed";
        if (status === "closed") status = "completed";
        return { ...r, status };
      });
    },
    enabled: !!profile?.id,
  });

  const columns = [
    { key: "service", header: "Service Requested" },
    {
      key: "budget",
      header: "Budget Estimate",
      render: (item: ServiceRequest) => item.budget || "Not Specified",
    },
    {
      key: "status",
      header: "Status",
      render: (item: ServiceRequest) => <StatusBadge status={item.status} />,
    },
    {
      key: "created_at",
      header: "Date Submitted",
      render: (item: ServiceRequest) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: ServiceRequest) => (
        <Button
          size="sm"
          className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRequest(item);
          }}
        >
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      ),
    },
  ];

  const renderPipeline = (currentStatus: string) => {
    const currentIndex = PIPELINE_STAGES.indexOf(currentStatus.toLowerCase());

    return (
      <div className="flex items-center justify-between py-6 max-w-md mx-auto relative">
        <div className="absolute top-[38px] left-[32px] right-[32px] h-[3px] bg-white/10 -z-10" />
        <div
          className="absolute top-[38px] left-[32px] h-[3px] bg-[#22c55e] -z-10 transition-all duration-500 ease-out"
          style={{
            width: `${(Math.max(0, currentIndex) / (PIPELINE_STAGES.length - 1)) * 100}%`,
          }}
        />

        {PIPELINE_STAGES.map((stage, idx) => {
          const isDone = idx <= currentIndex;
          const label = stage.replace("_", " ").toUpperCase();

          return (
            <div key={stage} className="flex flex-col items-center gap-2">
              <div className="text-[10px] text-white/50 font-bold tracking-wider">{label}</div>
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isDone
                    ? "bg-[#1A6B1A]/20 border-[#22c55e] text-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                    : "bg-[#0F0F0F] border-white/10 text-white/30"
                }`}
              >
                {isDone ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4 fill-transparent" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
            <p className="text-white/50 text-sm mt-1">
              Check quotes, status reviews, and requirements submitted to our help desk.
            </p>
          </div>
          <Link to="/contact">
            <Button className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center justify-center gap-1.5">
              <Plus className="h-5 w-5" />
              Submit New Request
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="h-96 rounded-xl bg-white/5 border border-[rgba(26,107,26,0.3)] animate-pulse" />
        ) : (
          <DataTable
            columns={columns}
            data={requests}
            onRowClick={(row) => setSelectedRequest(row)}
          />
        )}
      </div>

      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Request Progress Tracker"
      >
        {selectedRequest && (
          <div className="space-y-6 text-sm text-white/95">
            <div>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                Service Request
              </span>
              <h4 className="font-bold text-white text-lg mt-0.5">{selectedRequest.service}</h4>
              {selectedRequest.budget && (
                <p className="text-xs text-white/60 mt-1">
                  Budget allocation:{" "}
                  <strong className="text-[#22c55e]">{selectedRequest.budget}</strong>
                </p>
              )}
            </div>

            <div className="border-y border-white/5 py-4">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider text-center">
                Inquiry Stage
              </p>
              {renderPipeline(selectedRequest.status)}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">
                Requirements Specification
              </p>
              <div className="bg-black/30 border border-[rgba(26,107,26,0.2)] rounded-lg p-3 max-h-40 overflow-y-auto text-white/80 whitespace-pre-wrap">
                {selectedRequest.description ?? "No description provided."}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                className="border-[rgba(26,107,26,0.3)] text-white/70 hover:bg-white/5"
                onClick={() => setSelectedRequest(null)}
              >
                Close details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
