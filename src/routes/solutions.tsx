import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, BarChart3, GraduationCap, HeartPulse, School, MapPin, Fuel, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="gradient-hero text-primary-foreground py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Solutions</h1>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">Battle-tested platforms powering critical operations across industries.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-6">
        {solutions.map(s => (
          <Card key={s.title} className="overflow-hidden hover:shadow-elegant transition-smooth">
            <div className="h-36 gradient-hero relative">
              <s.icon className="absolute right-6 bottom-6 h-20 w-20 text-white/20" />
              <div className="absolute left-6 bottom-6 text-primary-foreground">
                <div className="text-xs uppercase tracking-wider opacity-80">Platform</div>
                <div className="text-xl font-bold">{s.title}</div>
              </div>
            </div>
            <CardContent className="p-8">
              <p className="text-muted-foreground">{s.desc}</p>
              <ul className="mt-5 space-y-2">
                {s.features.map(f => <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> {f}</li>)}
              </ul>
              <Button asChild variant="hero" size="sm" className="mt-6"><Link to="/contact">Request demo</Link></Button>
            </CardContent>
          </Card>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
