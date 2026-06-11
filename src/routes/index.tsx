import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Cloud, GraduationCap, Network, Shield, Server, Building2, HeartPulse, School, MapPin, Fuel, BarChart3, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MRsoft Digital Hub — Enterprise ICT & Training" },
      { name: "description", content: "Empowering businesses through software, training, and digital transformation. Enterprise solutions for organizations of all sizes." },
      { property: "og:title", content: "MRsoft Digital Hub" },
      { property: "og:description", content: "Empowering businesses through innovative technology." },
    ],
  }),
  component: Home,
});

const services = [
  { icon: Code2, title: "Software Development", desc: "Custom enterprise applications engineered for scale and reliability." },
  { icon: Network, title: "Web Applications", desc: "Modern, responsive web platforms that deliver measurable results." },
  { icon: GraduationCap, title: "ICT Training", desc: "Industry-led training programs for professionals and graduates." },
  { icon: Shield, title: "IT Consultancy", desc: "Strategic advisory to align your technology with business goals." },
  { icon: Cloud, title: "Cloud & Hosting", desc: "Secure, scalable hosting and managed cloud infrastructure." },
  { icon: Server, title: "Network Solutions", desc: "Enterprise networking, security, and infrastructure delivery." },
];

const solutions = [
  { icon: Building2, title: "Enterprise Business Solution", desc: "ERP-class platform for finance, HR, and operations." },
  { icon: BarChart3, title: "Revenue Management System", desc: "Government and corporate revenue collection and analytics." },
  { icon: GraduationCap, title: "Learning Management System", desc: "Complete LMS for universities and corporate training." },
  { icon: HeartPulse, title: "Hospital Management System", desc: "End-to-end clinical, administrative, and billing platform." },
  { icon: School, title: "School Management System", desc: "K–12 and tertiary student information and operations." },
  { icon: MapPin, title: "Land Management System", desc: "Cadastral, titling, and land administration workflows." },
  { icon: Fuel, title: "Oil & Gas Information System", desc: "Upstream and downstream operations, reporting, compliance." },
];

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero} alt="" className="h-full w-full object-cover opacity-40" width={1920} height={1080} />
          <div className="absolute inset-0 gradient-hero opacity-90" />
        </div>
        <div className="container relative mx-auto px-4 py-28 md:py-40 text-center text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-glow animate-pulse" />
            Trusted by enterprises across 4 continents
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
            Empowering Businesses Through <span className="text-gradient bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">Innovative Technology</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Transforming organizations through software, training, and digital solutions built for the next decade.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="hero" size="lg" className="h-12 px-7">
              <Link to="/solutions">Explore Solutions <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-7 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
              <Link to="/auth">Register for Training</Link>
            </Button>
          </div>
          <div className="mt-16 grid grid-cols-3 max-w-2xl mx-auto gap-8 text-left">
            {[["500+","Enterprise clients"],["25k+","Trained students"],["99.9%","Uptime SLA"]].map(([k,v]) => (
              <div key={k}>
                <div className="text-3xl font-bold">{k}</div>
                <div className="text-sm text-primary-foreground/70">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-sm font-semibold text-primary uppercase tracking-wider">About MRsoft</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">Engineering trust into every line of code.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              M-R International (MRsoft) is an ICT company delivering enterprise software, training, and consulting to businesses, governments, universities, and hospitals. We pair deep technical expertise with a relentless focus on outcomes.
            </p>
            <ul className="mt-6 space-y-3">
              { ["ISO-aligned engineering practices","Domain experts across 7 industries","Dedicated training & certification track"].map(t => (
                <li key={t} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-primary mt-0.5" /> {t}</li>
              )) }
            </ul>
            <Button asChild className="mt-8" variant="hero"><Link to="/about">Learn more</Link></Button>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 gradient-primary opacity-20 blur-2xl rounded-3xl" />
            <Card className="relative shadow-elegant">
              <CardContent className="p-8 grid grid-cols-2 gap-6">
                {[ ["7+","Industries"],["15","Years"],["40+","Engineers"],["12","Countries"] ].map(([k,v]) => (
                  <div key={k}>
                    <div className="text-3xl font-bold text-gradient">{k}</div>
                    <div className="text-sm text-muted-foreground">{v}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm font-semibold text-primary uppercase tracking-wider">Services</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">What we do best</h2>
            <p className="mt-3 text-muted-foreground">End-to-end ICT services designed for organizations that need to move fast and stay secure.</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(s => (
              <Card key={s.title} className="card-interactive border-border/60">
                <CardContent className="p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  <Link to="/services" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Learn more <ArrowRight className="h-3.5 w-3.5" /></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-sm font-semibold text-primary uppercase tracking-wider">Solutions</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">Platforms built for industry</h2>
          <p className="mt-3 text-muted-foreground">Battle-tested products powering critical operations.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map(s => (
            <Card key={s.title} className="overflow-hidden card-interactive-accent">
              <div className="h-32 gradient-hero relative overflow-hidden">
                <s.icon className="absolute right-4 bottom-4 h-16 w-16 text-white/20" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                <Button asChild size="sm" variant="outline" className="mt-4"><Link to="/contact">Request demo</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 md:p-16 text-center text-primary-foreground shadow-elegant">
          <h2 className="text-3xl md:text-4xl font-bold max-w-2xl mx-auto">Ready to transform your organization?</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">Talk to our team about your next platform, training program, or migration.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild variant="hero" size="lg" className="h-12 px-7"><Link to="/contact">Start a project</Link></Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-7 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"><Link to="/auth">Join training</Link></Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
