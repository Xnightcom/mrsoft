import { createFileRoute, Link } from "@tanstack/react-router";
import { Code2, Cloud, GraduationCap, Network, Shield, Server, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="gradient-hero text-primary-foreground py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Services</h1>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">Six service lines, one mission: deliver outcomes that move your business forward.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-6">
        {services.map(s => (
          <Card key={s.title} className="hover:shadow-elegant transition-smooth">
            <CardContent className="p-8">
              <div className="grid h-12 w-12 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
                <s.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold">{s.title}</h2>
              <p className="mt-3 text-muted-foreground">{s.desc}</p>
              <ul className="mt-5 grid grid-cols-2 gap-y-2 text-sm">
                {s.features.map(f => <li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{f}</li>)}
              </ul>
              <Button asChild variant="hero" size="sm" className="mt-6"><Link to="/contact">Get a quote <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
            </CardContent>
          </Card>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
