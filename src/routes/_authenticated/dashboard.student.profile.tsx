import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Phone, Briefcase, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/student/profile")({
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const { profile, refetch } = useProfile();
  const [form, setForm] = useState({ full_name: "", phone: "", company: "", bio: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        company: profile.company ?? "",
        bio: profile.bio ?? "",
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        company: form.company,
        bio: form.bio,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile saved successfully");
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage your biographical and contact details.
          </p>
        </div>

        <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={save} className="space-y-4 text-xs">
              <div className="flex items-center gap-4 border-b border-white/5 pb-5">
                <img
                  src={
                    profile?.avatar_url ??
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  }
                  alt={profile?.full_name ?? "Student"}
                  className="h-16 w-16 rounded-full border border-[rgba(26,107,26,0.5)] object-cover"
                />
                <div>
                  <h4 className="font-bold text-white text-base">
                    {profile?.full_name ?? "Student Member"}
                  </h4>
                  <span className="text-[10px] bg-[#1A6B1A]/10 border border-[#1A6B1A]/20 text-[#22c55e] px-2 py-0.5 rounded font-bold uppercase block w-fit mt-1">
                    Student Account
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70">Full Name</Label>
                <Input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70">Phone Number</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/70">Company / University</Label>
                  <Input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70">Biography / Core Skills</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white font-bold"
                >
                  {saving ? "Saving Changes..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
