import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-white/50 text-sm mt-1">Platform-wide rules, security policies, and user configuration.</p>
        </div>

        <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#CC0000]/10 border border-[#CC0000]/30 text-[#CC0000] flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Roles & Permissions System</h3>
                <p className="text-sm text-white/60">
                  User accounts are categorized into Admin, Student, and Client levels. Roles are mapped to the <code>profiles.role</code> database column and enforce dynamic layout views.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-white/5 pt-6">
              <div className="h-10 w-10 rounded-lg bg-[#1A6B1A]/10 border border-[#1A6B1A]/30 text-[#22c55e] flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Row Level Security (RLS) Policies</h3>
                <p className="text-sm text-white/60">
                  All databases are protected by Supabase RLS. Students can query their own attendance, assignments, and certificates. Clients access invoices and projects related to their profile ID. Admins bypass these conditions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-white/5 pt-6">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Settings className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">General Platform Options</h3>
                <p className="text-sm text-white/60 text-justify">
                  Platform configurations (SMTP settings, Vercel pipelines, domain configuration) are managed via system environment variables. Inquiries and client project updates sync in real-time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
