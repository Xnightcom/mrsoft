import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Megaphone, Calendar, User, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnnouncementsView() {
  const { profile } = useProfile();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["role-announcements", profile?.role],
    queryFn: async () => {
      if (!profile?.role) return [];
      const { data, error } = await supabase
        .from("announcements")
        .select(
          `
          *,
          created_by_profile:profiles!announcements_created_by_fkey(full_name)
        `,
        )
        .contains("target_roles", [profile.role])
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out expired announcements (RLS should do this, but just in case)
      const now = new Date().getTime();
      return data.filter((ann: any) => !ann.expires_at || new Date(ann.expires_at).getTime() > now);
    },
    enabled: !!profile?.role,
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-white/50 text-sm mt-1">
          Platform updates, notice sheets, and system news.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/5 rounded-xl animate-pulse border border-[rgba(26,107,26,0.3)]"
            />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
          <h3 className="text-lg font-bold text-white mb-2">No announcements</h3>
          <p className="text-white/50">There are no new announcements at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann: any, index: number) => (
            <Card
              key={ann.id}
              className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] relative overflow-hidden animate-card-in opacity-0"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="space-y-1">
                  {ann.is_pinned ? (
                    <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 w-fit">
                      <Pin className="h-3.5 w-3.5" /> Pinned
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#CC0000]/10 border border-[#CC0000]/20 text-[#CC0000] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 w-fit">
                      <Megaphone className="h-3.5 w-3.5" /> Notice
                    </span>
                  )}
                  <CardTitle className="text-base font-bold text-white mt-1.5">
                    {ann.title}
                  </CardTitle>
                </div>
                <div className="text-right text-[10px] text-white/40 shrink-0">
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 justify-end mt-1">
                    <User className="h-3.5 w-3.5" />
                    {ann.created_by_profile?.full_name || "Admin"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-white/70 leading-relaxed text-justify pt-2 whitespace-pre-wrap">
                {ann.body}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
