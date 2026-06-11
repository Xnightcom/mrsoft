import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, BarChart3, GraduationCap, HeartPulse, School, MapPin, Fuel, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-active");
          }
        });
      },
      { threshold: 0.08 }
    );

    const revealables = document.querySelectorAll(".reveal-fade-up");
    revealables.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleCardTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const dx = x - xc;
    const dy = y - yc;
    const tiltX = (dy / yc) * -7;
    const tiltY = (dx / xc) * 7;
    el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleCardReset = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      <SiteHeader />
      
      <section className="relative overflow-hidden bg-[#0a0a0a] border-b border-white/5 py-20 md:py-28 text-center text-white">
        <div className="absolute inset-0">
          <div className="radar-beam-green opacity-30" />
        </div>
        <div className="container relative mx-auto px-4 z-10">
          <h1 className="text-4xl md:text-5xl font-bold heading-accent-center-green">Solutions</h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">Battle-tested platforms powering critical operations across industries.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-6 reveal-fade-up">
        {solutions.map(s => (
          <Card 
            key={s.title} 
            className="mrsoft-card overflow-hidden"
            onMouseMove={handleCardTilt}
            onMouseLeave={handleCardReset}
          >
            <div className="h-36 bg-gradient-to-r from-[#1A5C1A]/20 to-[#CC0000]/10 border-b border-white/5 relative">
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
                    <CheckCircle2 className="h-4 w-4 text-[#1A5C1A]" /> 
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="ripple-btn mt-6 bg-[#CC0000] hover:bg-[#AA0000] text-white border-none font-semibold transition-smooth" size="sm" onClick={createRipple}>
                <Link to="/contact">Request demo</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
      
      <SiteFooter />
    </div>
  );
}
