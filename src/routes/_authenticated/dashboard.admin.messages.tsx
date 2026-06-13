import React, { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, User, MessageSquare, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/messages")({
  component: AdminMessagesPage,
});

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

function AdminMessagesPage() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users (excluding self)
  const { data: users = [] } = useQuery({
    queryKey: ["admin-chat-users"],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .neq("id", profile.id)
        .in("role", ["student", "instructor", "client"])
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!profile?.id,
  });

  // Fetch messages between admin and selected user
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", profile?.id, selectedUser?.id],
    queryFn: async () => {
      if (!profile?.id || !selectedUser?.id) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${profile.id})`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!profile?.id && !!selectedUser?.id,
  });

  const { data: unreadCounts = {} } = useQuery({
    queryKey: ["unread-messages", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {};
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", profile.id)
        .eq("is_read", false);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((m) => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!profile?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel("messages_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["messages", profile?.id, selectedUser?.id] });
          qc.invalidateQueries({ queryKey: ["unread-messages", profile?.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, selectedUser?.id, qc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (profile?.id && selectedUser?.id) {
      const markRead = async () => {
        const { error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("receiver_id", profile.id)
          .eq("sender_id", selectedUser.id)
          .eq("is_read", false);
        if (!error) {
          qc.invalidateQueries({ queryKey: ["unread-messages", profile?.id] });
          qc.invalidateQueries({ queryKey: ["notifications", profile?.id] });
        }
      };
      markRead();
    }
  }, [selectedUser?.id, profile?.id, qc]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedUser || !profile) return;
      const { error } = await supabase.from("messages").insert({
        sender_id: profile.id,
        receiver_id: selectedUser.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
    },
    onError: (e: any) => {
      console.error("Message send error:", e);
      toast.error(e.message || "Failed to send message");
    },
  });

  const filteredUsers = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex md:gap-6 relative">
        {/* Left Panel - Users List */}
        <div className={`w-full md:w-80 shrink-0 bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl flex-col overflow-hidden ${selectedUser ? "hidden md:flex" : "flex h-full"}`}>
          <div className="p-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white placeholder-white/45 h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-white/5 hover:bg-white/5 ${
                  selectedUser?.id === u.id ? "bg-[#CC0000]/10 border-l-2 border-l-[#CC0000]" : ""
                }`}
              >
                <div className="relative h-10 w-10 shrink-0 rounded-full bg-[#1A6B1A]/20 flex items-center justify-center border border-[#1A6B1A]/30 overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-[#1A6B1A]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.full_name || "Unnamed User"}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">{u.role}</p>
                </div>
                {unreadCounts[u.id] > 0 && (
                  <div className="h-5 min-w-[20px] rounded-full bg-[#CC0000] flex items-center justify-center text-[10px] font-bold text-white px-1">
                    {unreadCounts[u.id]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Chat Thread */}
        <div className={`flex-1 bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl flex-col overflow-hidden ${selectedUser ? "flex h-full" : "hidden md:flex h-full"}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="h-16 flex items-center gap-3 px-4 md:px-6 border-b border-white/5 shrink-0 bg-[#0A0A0A]">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-2 -ml-2 text-white/70 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-8 w-8 rounded-full bg-[#CC0000]/20 flex items-center justify-center border border-[#CC0000]/30 overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-[#CC0000]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedUser.full_name || "Unnamed User"}</h3>
                  <p className="text-[10px] text-white/50 uppercase">{selectedUser.role}</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A6B1A] border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/30 text-sm">
                    No messages yet. Send a message to start the conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMe
                              ? "bg-[#CC0000]/20 text-white border border-[#CC0000]/30 rounded-br-sm"
                              : "bg-[#1A6B1A]/10 text-white border border-[#1A6B1A]/20 rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                          <div className={`text-[9px] mt-1 opacity-50 ${isMe ? "text-right" : "text-left"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/5 bg-[#0A0A0A] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (messageText.trim()) {
                      sendMessage.mutate(messageText);
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 bg-[#060606] border-[rgba(26,107,26,0.3)] text-white h-10 rounded-full px-4"
                  />
                  <Button
                    type="submit"
                    disabled={sendMessage.isPending || !messageText.trim()}
                    className="h-10 w-10 rounded-full p-0 bg-[#CC0000] hover:bg-[#CC0000]/80 text-white shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 opacity-50" />
              </div>
              <p>Select a user to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
