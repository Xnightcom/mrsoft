import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "@tanstack/react-router";

export function NotificationBell() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications", profile?.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, qc]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", profile?.id] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["notifications", profile?.id] });
    }
    if (link) {
      setOpen(false);
      navigate({ to: link });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (unreadCount > 0) {
            markAllAsRead.mutate();
          }
        }}
        className="relative rounded-lg p-1.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC0000] text-[9px] font-bold text-white shadow-[0_0_5px_rgba(204,0,0,0.5)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-80 rounded-xl border border-[rgba(26,107,26,0.3)] bg-[#0F0F0F] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in fade-in-50 slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(26,107,26,0.1)] pb-2 mb-2 px-1">
              <h4 className="text-sm font-semibold text-white">Notifications</h4>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/50">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif: any) => {
                  let icon = "ℹ️";
                  if (notif.type === "new_user") icon = "👤";
                  else if (notif.type === "approval") icon = "✅";
                  else if (notif.type === "warning") icon = "⚠️";
                  else if (notif.type === "error") icon = "❌";

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id, notif.action_url || notif.link)}
                      className={`rounded-lg p-3 text-xs transition-colors cursor-pointer border flex gap-3 items-start ${
                        notif.is_read
                          ? "bg-[#111] hover:bg-white/5 border-transparent"
                          : "bg-[#CC0000]/5 hover:bg-[#CC0000]/10 border-[#CC0000]/30"
                      }`}
                    >
                      <div className="text-lg mt-0.5">{icon}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-semibold text-white">{notif.title}</span>
                          <span className="text-[10px] text-white/40 whitespace-nowrap">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {notif.body && <p className="text-white/60 line-clamp-2">{notif.body}</p>}
                        
                        {notif.type === "new_user" && notif.action_url && !notif.is_read && (
                          <div className="mt-2 text-[#CC0000] font-medium hover:underline text-[10px]">
                            Review Request →
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[rgba(26,107,26,0.1)] pt-3 mt-2 px-1">
              <button
                onClick={() => markAllAsRead.mutate()}
                className="text-[10px] text-white/50 hover:text-white"
                disabled={unreadCount === 0 || markAllAsRead.isPending}
              >
                Mark all as read
              </button>
              <button className="text-[10px] text-[#CC0000] hover:underline" onClick={() => setOpen(false)}>
                View all
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
