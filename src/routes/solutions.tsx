import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, BarChart3, GraduationCap, HeartPulse, School, MapPin, Fuel, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/TiltCard";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { createRipple } from "@/lib/utils";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions — MRsoft Digital Hub" },
      { name: "description", content: "Enterprise products: ERP, LMS, Hospital, School, Land, Revenue, and Oil & Gas management systems." },
    ],
  }),
  component: SolutionsPage,
});

const solutions = [
  { icon: Building2, title: "Enterprise Business Solution", desc: "Unified ERP for finance, HR, procurement, inventory, and operations.", features: ["Multi-entity finance", "HR & payroll", "Procurement workflows", "Real-time dashboards"] },
  { icon: BarChart3, title: "Revenue Management System", desc: "Revenue collection, billing, and reconciliation for government and corporates.", features: ["Multi-channel collection", "Auto reconciliation", "Audit trail", "Tax compliance"] },
  { icon: GraduationCap, title: "Learning Management System", desc: "End-to-end LMS with courses, quizzes, certificates, and analytics.", features: ["Video lessons", "Assignments & grading", "Auto certificates", "Cohort analytics"] },
  { icon: HeartPulse, title: "Hospital Management System", desc: "Patient records, OPD/IPD, lab, pharmacy, and billing in one place.", features: ["EMR", "Pharmacy & lab", "Insurance claims", "Telemedicine"] },
  { icon: School, title: "School Management System", desc: "Student information, fees, results, and parent communication.", features: ["Admissions", "Timetables", "Fees & invoicing", "Parent portal"] },
  { icon: MapPin, title: "Land Management System", desc: "Cadastral records, titling, and land transaction workflows.", features: ["GIS integration", "Title processing", "Public search", "Revenue link"] },
  { icon: Fuel, title: "Oil & Gas Information System", desc: "Upstream and downstream operations, compliance, and reporting.", features: ["Operations tracking", "Regulatory reporting", "Inventory", "Analytics"] },
];

function SolutionsPage() {
  useScrollReveal();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="relative overflow-hidden py-20 md:py-28 text-center text-white" style={{ borderBottom: "1px solid rgba(26,107,26,0.3)" }}>
        <div className="container relative mx-auto px-4" style={{ zIndex: 5 }}>
          <h1 className="text-4xl md:text-5xl font-bold heading-accent-center-green heading-slide-in">Solutions</h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto reveal-fade-up">Battle-tested platforms powering critical operations across industries.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-6 reveal-stagger">
        {solutions.map(s => (
          <div key={s.title} className="reveal-fade-up">
            <TiltCard className="overflow-hidden">
              <div className="h-36 relative" style={{ background: "linear-gradient(to right, rgba(26,107,26,0.15), rgba(204,0,0,0.08))", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <s.icon className="absolute right-6 bottom-6 h-20 w-20 text-white/5" />
                <div className="absolute left-6 bottom-6 text-white">
                  <div className="text-xs uppercase tracking-wider opacity-60">Platform</div>
                  <div className="text-xl font-bold">{s.title}</div>
                </div>
              </div>
              <CardContent className="p-8">
                <p className="text-white/60">{s.desc}</p>
                <ul className="mt-5 space-y-2">
                  {s.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                      <CheckCircle2 className="h-4 w-4 text-[#1A6B1A]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="ripple-btn mt-6 btn-primary-gradient" size="sm" onClick={createRipple}>
                  <Link to="/contact">Request demo</Link>
                </Button>
              </CardContent>
            </TiltCard>
          </div>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
