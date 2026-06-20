import React, { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageSquare, Send, User, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/client/messages")({
  component: ClientMessagesPage,
});

interface Project {
  id: string;
  title: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function ClientMessagesPage() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["client-chat-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("id, title")
        .eq("client_id", profile.id);

      if (error) throw error;

      const augmentedProjects: Project[] = [];
      for (const p of projectsData) {
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("project_id", p.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        augmentedProjects.push({
          id: p.id,
          title: p.title,
          lastMessage: lastMsg?.content ?? "No messages yet. Say hello!",
          lastMessageTime: lastMsg?.created_at
            ? new Date(lastMsg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined,
        });
      }

      return augmentedProjects;
    },
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: serverMessages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ["project-messages", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedProjectId,
  });

  useEffect(() => {
    setLocalMessages(serverMessages);
  }, [serverMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const channel = supabase
      .channel(`project-messages-channel:${selectedProjectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${selectedProjectId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          setLocalMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedProjectId]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId || !profile?.id || !inputText.trim()) return;
      const { error } = await supabase.from("messages").insert({
        project_id: selectedProjectId,
        sender_id: profile.id,
        content: inputText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setInputText("");
      qc.invalidateQueries({ queryKey: ["client-chat-projects"] });
    },
    onError: (e: any) => {
      toast.error("Message delivery failed: " + e.message);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage.mutate();
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-140px)] flex rounded-xl border border-[rgba(26,107,26,0.3)] bg-[#0F0F0F] overflow-hidden">
        <div className="w-full md:w-80 border-r border-[rgba(26,107,26,0.3)] bg-[#0A0A0A] flex flex-col shrink-0">
          <div className="p-4 border-b border-[rgba(26,107,26,0.15)] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#CC0000]" />
            <h3 className="font-bold text-white text-sm tracking-wider uppercase">Project Chats</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {projectsLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
              ))
            ) : projects.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-8">No chats available.</p>
            ) : (
              projects.map((proj) => {
                const active = proj.id === selectedProjectId;
                return (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`w-full flex items-start justify-between p-3 rounded-lg text-left transition-all duration-200 ${
                      active
                        ? "bg-[#CC0000]/15 text-white border border-[#CC0000]/30 shadow-[0_0_8px_rgba(204,0,0,0.1)]"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">{proj.title}</h4>
                      <p className="text-[11px] text-white/50 truncate mt-1">{proj.lastMessage}</p>
                    </div>
                    {proj.lastMessageTime && (
                      <span className="text-[9px] text-white/30 shrink-0 ml-1.5 pt-0.5">
                        {proj.lastMessageTime}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#060606]">
          {selectedProjectId && selectedProject ? (
            <>
              <div className="p-4 border-b border-[rgba(26,107,26,0.15)] bg-[#0A0A0A] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedProject.title}</h3>
                  <p className="text-[10px] text-white/50">Engineering Collaboration Channel</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {msgsLoading ? (
                  <div className="h-full flex items-center justify-center text-xs text-white/40 animate-pulse">
                    Retrieving secure message logs...
                  </div>
                ) : localMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-white/40">
                    <MessageSquare className="h-10 w-10 text-white/20" />
                    <p className="text-xs">No project messages exchanged yet.</p>
                    <p className="text-[10px] text-white/30">
                      Write a message below to coordinate with our developers.
                    </p>
                  </div>
                ) : (
                  localMessages.map((msg) => {
                    const isClient = msg.sender_id === profile?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-xl px-4 py-2.5 text-xs shadow-md border ${
                            isClient
                              ? "bg-[#1A6B1A] text-white border-transparent rounded-tr-none"
                              : "bg-[#111] text-white border-white/10 rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <span className="block text-[8px] text-white/40 text-right mt-1.5">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="p-4 border-t border-[rgba(26,107,26,0.15)] bg-[#0A0A0A] flex gap-2"
              >
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message to sync with engineering team..."
                  className="flex-1 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white placeholder-white/40 text-xs"
                />
                <Button
                  type="submit"
                  disabled={sendMessage.isPending || !inputText.trim()}
                  className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center justify-center gap-1.5 font-bold"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40">
              <MessageSquare className="h-12 w-12 text-white/10 mb-2" />
              <p className="text-sm">Select a project to initiate communication logs.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
