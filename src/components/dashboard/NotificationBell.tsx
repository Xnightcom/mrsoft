import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [shake, setShake] = useState(false);

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
          setShake(true);
          setTimeout(() => setShake(false), 1000);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, qc]);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

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
    <DropdownMenu open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o && unreadCount > 0) {
        markAllAsRead.mutate();
      }
    }}>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative rounded-lg p-1.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors focus:outline-none bell-icon-btn ${
            shake ? 'animate-bell-shake' : ''
          }`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC0000] text-[9px] font-bold text-white shadow-[0_0_5px_rgba(204,0,0,0.5)] notification-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 rounded-xl border-[rgba(26,107,26,0.3)] bg-[#0F0F0F] shadow-[0_4px_20px_rgba(0,0,0,0.5)] mt-2 notification-dropdown">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="text-white text-sm font-semibold p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead.mutate();
              }}
              className="text-[10px] text-white/50 hover:text-white hover:underline pr-1"
            >
              Mark all as read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-[rgba(26,107,26,0.2)]" />
        
        <div className="max-h-[300px] overflow-y-auto pr-1 p-1">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/50">
              No notifications yet.
            </div>
          ) : (
            notifications.slice(0, 5).map((notif: any) => {
              let icon = "ℹ️";
              if (notif.type === "new_user") icon = "👤";
              else if (notif.type === "approval") icon = "✅";
              else if (notif.type === "warning") icon = "⚠️";
              else if (notif.type === "error") icon = "❌";

              return (
                <DropdownMenuItem
                  key={notif.id}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMarkAsRead(notif.id, notif.action_url || notif.link);
                  }}
                  className={`flex gap-3 items-start p-3 mb-1 rounded-lg cursor-pointer transition-colors notification-item ${
                    notif.is_read
                      ? "hover:bg-white/5 text-white/70"
                      : "bg-[#CC0000]/5 hover:bg-[#CC0000]/10 text-white"
                  }`}
                >
                  <div className="text-lg mt-0.5">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="font-semibold text-xs truncate leading-tight">{notif.title}</span>
                      <span className="text-[10px] text-white/40 shrink-0">
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {notif.body && <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">{notif.body}</p>}
                    
                    {notif.type === "new_user" && notif.action_url && !notif.is_read && (
                      <div className="mt-2 text-[#CC0000] font-medium hover:underline text-[10px]">
                        Review Request →
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
