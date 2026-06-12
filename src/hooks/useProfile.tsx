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
      if (isInitial) setLoading(true);

      // Wrap the entire fetch in a 5s timeout — never hang forever
      const result = await Promise.race([
        fetchProfileInner(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);

      if (result === null) {
        // Timeout reached — stop loading, profile stays null
        console.warn("[useProfile] Profile fetch timed out after 5s");
      }
    } catch (err) {
      console.error("[useProfile] Fatal error:", err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const fetchProfileInner = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setProfile(null);
      return "done";
    }

    // Use maybeSingle — does NOT throw if row is missing
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("[useProfile] Error fetching profile:", error);
      return "done";
    }

    if (data) {
      setProfile(data as Profile);
      return "done";
    }

    // ---------- PROFILE DOES NOT EXIST — auto-create ----------
    console.warn(
      "[useProfile] No profile row, auto-creating for",
      session.user.id,
    );
    const defaultProfile = {
      id: session.user.id,
      full_name:
        session.user.user_metadata?.full_name ??
        session.user.email?.split("@")[0] ??
        "User",
      avatar_url: session.user.user_metadata?.avatar_url ?? null,
      role: "client" as const,
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
      // Use local fallback so UI doesn't hang
      setProfile({
        ...defaultProfile,
        created_at: new Date().toISOString(),
      } as Profile);
    } else if (inserted) {
      setProfile(inserted as Profile);
    } else {
      setProfile({
        ...defaultProfile,
        created_at: new Date().toISOString(),
      } as Profile);
    }

    return "done";
  };

  useEffect(() => {
    fetchProfile(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: string) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          fetchProfile(false);
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
          setLoading(false);
        }
      },
    );

    // HARD SAFETY: force loading=false after 6s no matter what
    const hardTimeout = setTimeout(() => {
      setLoading(false);
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(hardTimeout);
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
