import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "student" | "client";
  company: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  role: "admin" | "student" | "client" | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  role: null,
  loading: true,
  refetch: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchProfile = async (isInitial = false) => {
    // Guard against concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Only show loading spinner on initial fetch, not on refetch/auth-change
      if (isInitial) setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Use maybeSingle — does NOT throw if row is missing (returns null)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        // Still set loading false so UI doesn't hang
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        setLoading(false);
        return;
      }

      // ---------- PROFILE DOES NOT EXIST — auto-create ----------
      console.warn("[useProfile] No profile row found, auto-creating default profile for", session.user.id);
      const defaultProfile = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0] ?? "User",
        avatar_url: session.user.user_metadata?.avatar_url ?? null,
        role: "client" as const, // default role
        company: null,
        phone: null,
        bio: null,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .upsert(defaultProfile, { onConflict: "id" })
        .select("*")
        .maybeSingle();

      if (insertError) {
        console.error("[useProfile] Failed to auto-create profile:", insertError);
        // Even on insert failure, create a local-only profile so the UI doesn't hang
        setProfile({
          ...defaultProfile,
          created_at: new Date().toISOString(),
        } as Profile);
      } else if (inserted) {
        setProfile(inserted as Profile);
      } else {
        // Upsert succeeded but returned no data — use local fallback
        setProfile({
          ...defaultProfile,
          created_at: new Date().toISOString(),
        } as Profile);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchProfile(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        fetchProfile(false);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        role: profile?.role ?? null,
        loading,
        refetch: () => fetchProfile(false),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
