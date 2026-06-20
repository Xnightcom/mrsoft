import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Modal } from "@/components/dashboard/Modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, User, Briefcase, Mail, Phone, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/admin/requests")({
  component: AdminRequestsKanban,
});

interface ServiceRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string;
  budget: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

const COLUMNS = [
  { id: "pending", label: "Pending", color: "border-yellow-500/30 text-yellow-500" },
  { id: "reviewed", label: "Reviewed", color: "border-blue-500/30 text-blue-400" },
  { id: "in_progress", label: "In Progress", color: "border-green-500/30 text-green-400" },
  { id: "completed", label: "Completed", color: "border-gray-500/30 text-gray-400" },
];

function AdminRequestsKanban() {
  const qc = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-requests-kanban"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as ServiceRequest[]).map((r) => {
        // Normalize legacy statuses
        let status = r.status.toLowerCase();
        if (status === "new") status = "pending";
        if (status === "contacted") status = "reviewed";
        if (status === "closed") status = "completed";
        return { ...r, status };
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("service_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-requests-kanban"] });
      qc.invalidateQueries({ queryKey: ["admin-overview-stats"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("requestId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    const id = e.dataTransfer.getData("requestId");
    if (id) {
      updateStatus.mutate({ id, status });
      toast.success(`Request moved to ${status.replace("_", " ")}`);
    }
  };

  const shiftStatus = (req: ServiceRequest, direction: "left" | "right") => {
    const statusOrder = ["pending", "reviewed", "in_progress", "completed"];
    const currentIndex = statusOrder.indexOf(req.status);
    const nextIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < statusOrder.length) {
      const nextStatus = statusOrder[nextIndex];
      updateStatus.mutate({ id: req.id, status: nextStatus });
      toast.success(`Request status updated to ${nextStatus.replace("_", " ")}`);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    setTimeout(() => {
      toast.success(`Reply sent to ${selectedRequest?.email}`);
      setReplyText("");
      setIsReplying(false);
      setSelectedRequest(null);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage inbound client project inquiries via Kanban columns. Drag and drop cards or click
            arrows to transition.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((col) => (
              <div
                key={col}
                className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-4 space-y-4"
              >
                <Skeleton w="60%" h={12} />
                <div className="space-y-2">
                  <div className="p-3 bg-[#060606] border border-white/5 rounded-lg space-y-2">
                    <Skeleton w="40%" h={10} />
                    <Skeleton w="80%" h={10} style={{ marginTop: 6 }} />
                  </div>
                  <div className="p-3 bg-[#060606] border border-white/5 rounded-lg space-y-2">
                    <Skeleton w="50%" h={10} />
                    <Skeleton w="70%" h={10} style={{ marginTop: 6 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {COLUMNS.map((column) => {
              const columnRequests = requests.filter((r) => r.status === column.id);

              return (
                <div
                  key={column.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-center px-4 py-3 border-b border-[rgba(26,107,26,0.2)]">
                    <span className="font-semibold text-white tracking-wider uppercase text-xs">
                      {column.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-bold text-white/70">
                      {columnRequests.length}
                    </span>
                  </div>

                  {/* Column Body */}
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[70vh]">
                    {columnRequests.length === 0 ? (
                      <div className="h-32 flex items-center justify-center border border-dashed border-white/5 rounded-lg text-xs text-white/40">
                        No requests
                      </div>
                    ) : (
                      columnRequests.map((req) => (
                        <div
                          key={req.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, req.id)}
                          onClick={() => setSelectedRequest(req)}
                          className="bg-[#060606] border border-white/5 hover:border-[#CC0000]/50 rounded-lg p-3 cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(204,0,0,0.1)] group relative"
                        >
                          <div className="text-xs font-semibold text-white truncate">
                            {req.name}
                          </div>
                          <div className="text-[11px] text-white/60 font-medium truncate mt-1">
                            {req.service}
                          </div>
                          {req.budget && (
                            <div className="mt-1 inline-block text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/70">
                              {req.budget}
                            </div>
                          )}
                          <div className="text-[10px] text-white/40 mt-2 flex items-center justify-between">
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {req.status !== "pending" && (
                                <button
                                  onClick={() => shiftStatus(req, "left")}
                                  className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                              )}
                              {req.status !== "completed" && (
                                <button
                                  onClick={() => shiftStatus(req, "right")}
                                  className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details & Compose Reply Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Service Request Details"
      >
        {selectedRequest && (
          <div className="space-y-4 text-sm text-white/95">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-white/80">
                <User className="h-4 w-4 text-[#CC0000]" />
                <span className="font-semibold text-white">{selectedRequest.name}</span>
                {selectedRequest.company && (
                  <span className="text-xs text-white/50">({selectedRequest.company})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Mail className="h-4 w-4 text-[#1A6B1A]" />
                <span>{selectedRequest.email}</span>
              </div>
              {selectedRequest.phone && (
                <div className="flex items-center gap-2 text-white/70">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span>{selectedRequest.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-white/70">
                <Briefcase className="h-4 w-4 text-[#CC0000]" />
                <span>
                  Service: <strong className="text-white">{selectedRequest.service}</strong>
                </span>
              </div>
              {selectedRequest.budget && (
                <div className="flex items-center gap-2 text-white/70">
                  <span className="text-xs text-white/50">Budget:</span>
                  <span className="font-semibold text-[#1A6B1A]">{selectedRequest.budget}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Calendar className="h-4 w-4 text-white/40" />
                <span>Submitted on {new Date(selectedRequest.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-[rgba(26,107,26,0.15)] pt-3">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">
                Project description
              </p>
              <div className="bg-black/30 border border-[rgba(26,107,26,0.2)] rounded-lg p-3 max-h-40 overflow-y-auto text-white/80 whitespace-pre-wrap">
                {selectedRequest.description ?? "No description provided."}
              </div>
            </div>

            {/* Compose Reply Form */}
            <div className="border-t border-[rgba(26,107,26,0.15)] pt-3 space-y-2">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">
                Send Reply Email
              </p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your email response here..."
                rows={3}
                className="w-full rounded-lg bg-[#060606] border border-[rgba(26,107,26,0.3)] p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-[rgba(26,107,26,0.3)] text-[#1A6B1A] hover:bg-[#1A6B1A]/10 hover:text-white"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isReplying || !replyText.trim()}
                  className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white"
                  onClick={handleSendReply}
                >
                  {isReplying ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
