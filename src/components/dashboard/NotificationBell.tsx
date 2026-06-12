import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

export function NotificationBell() {
  const { profile } = useProfile();
  const qc = useQueryClient();
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
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

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

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["notifications", profile?.id] });
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
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-80 rounded-xl border border-[rgba(26,107,26,0.3)] bg-[#0F0F0F] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in fade-in-50 slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(26,107,26,0.1)] pb-2 mb-2">
              <h4 className="text-sm font-semibold text-white">Notifications</h4>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-[#CC0000] hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-4 text-center text-xs text-white/50">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`rounded-lg p-2.5 text-xs transition-colors cursor-pointer ${
                      notif.is_read
                        ? "bg-[#111] hover:bg-white/5"
                        : "bg-[#CC0000]/10 hover:bg-[#CC0000]/15 border-l-2 border-[#CC0000]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-semibold text-white">{notif.title}</span>
                      <span className="text-[10px] text-white/40">
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {notif.body && <p className="text-white/70">{notif.body}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
