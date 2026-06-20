import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Award, Download, Share2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/student/certificates")({
  component: StudentCertificatesPage,
});

interface Certificate {
  id: string;
  issued_at: string;
  pdf_url: string | null;
  share_token: string | null;
  course: {
    title: string;
  } | null;
}

function StudentCertificatesPage() {
  const { profile } = useProfile();

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["student-certificates", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("certificates")
        .select(
          `
          id,
          issued_at,
          pdf_url,
          share_token,
          course_id
        `,
        )
        .eq("student_id", profile.id);

      if (error) throw error;

      // Fetch course names manually
      const courseIds = data.map((a: any) => a.course_id).filter(Boolean);
      const coursesMap: Record<string, string> = {};
      if (courseIds.length > 0) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);
        if (courseData) {
          courseData.forEach((c: any) => {
            coursesMap[c.id] = c.title;
          });
        }
      }

      return data.map((a: any) => ({
        ...a,
        course: a.course_id ? { title: coursesMap[a.course_id] || "Course" } : null,
      })) as unknown as Certificate[];
    },
    enabled: !!profile?.id,
  });

  const handleCopyLink = (token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/certificates/share/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  const handleDownloadPdf = (pdfUrl: string | null) => {
    if (!pdfUrl) {
      toast.error("PDF download link not available");
      return;
    }
    window.open(pdfUrl, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="text-white/50 text-sm mt-1">
            Download and share your earned course certifications.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-64 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/50 text-sm">
            No certificates earned yet. Complete 100% of a course syllabus to generate verified
            credentials.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] hover:border-[#CC0000]/50 rounded-xl overflow-hidden shadow-md flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_15px_rgba(204,0,0,0.15)]"
              >
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-[#0F0F0F] to-[#060606] flex items-start gap-4 border-b border-white/5">
                  <div className="bg-[#1A6B1A]/10 text-[#22c55e] border border-[#1A6B1A]/30 p-3 rounded-full shrink-0">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">
                      Certificate of Completion
                    </span>
                    <h4 className="font-bold text-white text-base mt-0.5 truncate">
                      {cert.course?.title ?? "Verified Course"}
                    </h4>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <img
                      src="/mrsoft-logo-new.png"
                      alt="MRsoft Logo"
                      className="h-6 w-auto object-contain logo-blend mix-blend-screen opacity-70"
                    />
                    <div className="text-right">
                      <p className="text-[10px] text-white/40 uppercase">Issue Date</p>
                      <p className="text-xs font-semibold text-white/80">
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[9px] text-white/30 font-mono uppercase tracking-wider">
                      Share Token
                    </p>
                    <p className="text-[10px] font-mono text-white/60 truncate mt-0.5">
                      {cert.share_token ?? cert.id}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-[#0A0A0A] border-t border-white/5 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[rgba(26,107,26,0.3)] text-[#1A6B1A] hover:bg-[#1A6B1A]/10 hover:text-white flex items-center justify-center gap-1.5 text-xs"
                    onClick={() => handleDownloadPdf(cert.pdf_url)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white flex items-center justify-center gap-1.5 text-xs"
                    onClick={() => handleCopyLink(cert.share_token)}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share Link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
