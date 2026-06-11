import { createFileRoute, Link } from "@tanstack/react-router";
import { Code2, Cloud, GraduationCap, Network, Shield, Server, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createRipple } from "@/lib/utils";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — MRsoft Digital Hub" },
      { name: "description", content: "Software development, web apps, ICT training, consultancy, cloud hosting, and network solutions from MRsoft." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  { icon: Code2, title: "Software Development", desc: "We engineer mission-critical software across web, mobile, and back-office systems. From product discovery to multi-region deployment.", features: ["Architecture & design", "Custom backend & APIs", "Mobile & desktop apps", "Modernization of legacy systems"] },
  { icon: Network, title: "Web Applications", desc: "Modern web platforms with great UX, accessibility, and performance built in.", features: ["Responsive UI", "Headless CMS", "E-commerce", "Progressive web apps"] },
  { icon: GraduationCap, title: "ICT Training", desc: "Instructor-led and on-demand training that turns graduates into employable engineers.", features: ["Full-stack development", "Cloud & DevOps", "Data analytics", "Cybersecurity"] },
  { icon: Shield, title: "IT Consultancy", desc: "Strategy and execution support from architects who've delivered at scale.", features: ["Digital strategy", "Tech due diligence", "Compliance & security", "Vendor selection"] },
  { icon: Cloud, title: "Cloud & Hosting", desc: "Secure infrastructure, managed cloud, and disaster recovery for regulated industries.", features: ["AWS, Azure, GCP", "Managed Kubernetes", "Backups & DR", "24/7 monitoring"] },
  { icon: Server, title: "Network Solutions", desc: "Enterprise networking, structured cabling, and security infrastructure.", features: ["LAN/WAN design", "Firewalls & VPN", "Wi-Fi 6/7", "Surveillance"] },
];

function ServicesPage() {
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
          <div className="radar-beam-red opacity-30" />
        </div>
        <div className="container relative mx-auto px-4 z-10">
          <h1 className="text-4xl md:text-5xl font-bold heading-accent-center-red">Services</h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">Six service lines, one mission: deliver outcomes that move your business forward.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-6 reveal-fade-up">
        {services.map(s => (
          <Card 
            key={s.title} 
            className="mrsoft-card"
            onMouseMove={handleCardTilt}
            onMouseLeave={handleCardReset}
          >
            <CardContent className="p-8">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#1A5C1A]/20 text-[#1A5C1A] border border-[#1A5C1A]/30">
                <s.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-white">{s.title}</h2>
              <p className="mt-3 text-white/60">{s.desc}</p>
              <ul className="mt-5 grid grid-cols-2 gap-y-2 text-sm text-white/80">
                {s.features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1A5C1A]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="ripple-btn mt-6 bg-[#CC0000] hover:bg-[#AA0000] text-white border-none font-semibold transition-smooth" size="sm" onClick={createRipple}>
                <Link to="/contact">Get a quote <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
      
      <SiteFooter />
    </div>
  );
}
