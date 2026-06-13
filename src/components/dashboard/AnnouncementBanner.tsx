import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Megaphone, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function AnnouncementBanner() {
  const { profile } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  const { data: latestAnnouncement } = useQuery({
    queryKey: ["latest-announcement", profile?.role],
    queryFn: async () => {
      if (!profile?.role) return null;
      
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .contains("target_roles", [profile.role])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) return null;
      
      // Filter out expired announcements
      if (data && data.expires_at) {
        if (new Date(data.expires_at).getTime() < new Date().getTime()) {
          return null;
        }
      }
      
      return data;
    },
    enabled: !!profile?.role,
  });

  if (!latestAnnouncement || dismissed) return null;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 flex items-start gap-3 relative animate-card-in">
      <div className="bg-yellow-500/20 p-2 rounded shrink-0">
        <Megaphone className="h-4 w-4 text-yellow-500" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-yellow-500 text-sm truncate">{latestAnnouncement.title}</span>
          <span className="text-white/40 text-[10px] shrink-0 whitespace-nowrap">
            {new Date(latestAnnouncement.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs text-white/70 mt-1 line-clamp-1">
          {latestAnnouncement.body}
        </p>
        <Link 
          to={`/dashboard/${profile?.role || 'client'}/announcements`}
          className="text-yellow-500 text-xs font-semibold mt-1 inline-block hover:underline"
        >
          Read more
        </Link>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="text-white/40 hover:text-white shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
