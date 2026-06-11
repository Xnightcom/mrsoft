import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Cloud, GraduationCap, Network, Shield, Server, Building2, HeartPulse, School, MapPin, Fuel, BarChart3, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { TiltCard } from "@/components/TiltCard";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { createRipple } from "@/lib/utils";
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
  useScrollReveal();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center" style={{ borderBottom: "1px solid rgba(26,107,26,0.3)" }}>
        <div className="absolute inset-0">
          <img src={hero} alt="" className="h-full w-full object-cover opacity-8" width={1920} height={1080} />
          <div className="absolute inset-0 bg-[#060606]/92" />
        </div>
        {/* Layer 4: Perspective Grid */}
        <div className="perspective-grid" />
        <div className="container relative mx-auto px-4 py-28 md:py-40 text-center text-white" style={{ zIndex: 5 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1A6B1A] animate-pulse" />
            Trusted by enterprises across 4 continents
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight heading-slide-in">
            Empowering Businesses Through <span className="text-gradient">Innovative Technology</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto reveal-fade-up">
            Transforming organizations through software, training, and digital solutions built for the next decade.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 reveal-fade-up">
            <Button asChild className="ripple-btn h-12 px-7 bg-[#CC0000] hover:bg-[#1A6B1A] text-white border-none font-semibold transition-all duration-300" size="lg" onClick={createRipple}>
              <Link to="/solutions">Explore Solutions <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild className="ripple-btn h-12 px-7 bg-transparent border text-white hover:bg-[#1A6B1A]/20 transition-all duration-300 font-semibold" size="lg" onClick={createRipple} style={{ borderColor: "rgba(26,107,26,0.6)" }}>
              <Link to="/auth">Register for Training</Link>
            </Button>
          </div>
          <div className="mt-16 grid grid-cols-3 max-w-2xl mx-auto gap-8 text-left pt-10 reveal-fade-up" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {[["500", "+", "Enterprise clients"], ["25", "k+", "Trained students"], ["99.9", "%", "Uptime SLA"]].map(([num, suffix, label]) => (
              <div key={num}>
                <div className="text-3xl font-bold text-[#CC0000]">
                  <span data-count-to={num} data-count-suffix={suffix}>{num}{suffix}</span>
                </div>
                <div className="text-sm text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-20 md:py-28 reveal-fade-up">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-sm font-semibold text-[#CC0000] uppercase tracking-wider">About MRsoft</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold heading-accent-red heading-slide-in text-white">Engineering trust into every line of code.</h2>
            <p className="mt-6 text-white/70 leading-relaxed">
              M-R International (MRsoft) is an ICT company delivering enterprise software, training, and consulting to businesses, governments, universities, and hospitals. We pair deep technical expertise with a relentless focus on outcomes.
            </p>
            <ul className="mt-6 space-y-3">
              {["ISO-aligned engineering practices", "Domain experts across 7 industries", "Dedicated training & certification track"].map(t => (
                <li key={t} className="flex items-start gap-2 text-sm text-white/80"><CheckCircle2 className="h-5 w-5 text-[#1A6B1A] mt-0.5" /> {t}</li>
              ))}
            </ul>
            <Button asChild className="ripple-btn mt-8 btn-primary-gradient" onClick={createRipple}>
              <Link to="/about">Learn more</Link>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-[#1A6B1A]/10 opacity-30 blur-2xl rounded-3xl" />
            <TiltCard className="relative">
              <CardContent className="p-8 grid grid-cols-2 gap-6">
                {[["7+", "Industries"], ["15", "Years"], ["40+", "Engineers"], ["12", "Countries"]].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-3xl font-bold text-[#CC0000]">{k}</div>
                    <div className="text-sm text-white/60">{v}</div>
                  </div>
                ))}
              </CardContent>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 md:py-28 reveal-fade-up" style={{ borderTop: "1px solid rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm font-semibold text-[#1A6B1A] uppercase tracking-wider">Services</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold heading-accent-center-green heading-slide-in text-white">What we do best</h2>
            <p className="mt-4 text-white/60">End-to-end ICT services designed for organizations that need to move fast and stay secure.</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
            {services.map(s => (
              <TiltCard key={s.title}>
                <CardContent className="p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#1A6B1A]/15 text-[#1A6B1A] border" style={{ borderColor: "rgba(26,107,26,0.3)" }}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{s.desc}</p>
                  <Link to="/services" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#CC0000] hover:underline">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="container mx-auto px-4 py-20 md:py-28 reveal-fade-up">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-sm font-semibold text-[#CC0000] uppercase tracking-wider">Solutions</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold heading-accent-center-red heading-slide-in text-white">Platforms built for industry</h2>
          <p className="mt-4 text-white/60">Battle-tested products powering critical operations.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
          {solutions.map(s => (
            <TiltCard key={s.title} className="overflow-hidden">
              <div className="h-32 relative overflow-hidden" style={{ background: "linear-gradient(to right, rgba(26,107,26,0.15), rgba(204,0,0,0.08))", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <s.icon className="absolute right-4 bottom-4 h-16 w-16 text-white/5" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.desc}</p>
                <Button asChild size="sm" className="ripple-btn mt-4 bg-transparent border text-white hover:bg-[#1A6B1A]/20 transition-all duration-300 font-semibold" onClick={createRipple} style={{ borderColor: "rgba(26,107,26,0.5)" }}>
                  <Link to="/contact">Request demo</Link>
                </Button>
              </CardContent>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20 reveal-fade-up">
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center text-white" style={{ background: "#060606", border: "1px solid rgba(26,107,26,0.4)" }}>
          <div className="absolute -inset-4 bg-[#CC0000]/5 opacity-30 blur-2xl rounded-3xl" />
          <h2 className="text-3xl md:text-4xl font-bold max-w-2xl mx-auto relative z-10">Ready to transform your organization?</h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto relative z-10">Talk to our team about your next platform, training program, or migration.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 relative z-10">
            <Button asChild className="ripple-btn h-12 px-7 btn-primary-gradient shadow-glow" size="lg" onClick={createRipple}>
              <Link to="/contact">Start a project</Link>
            </Button>
            <Button asChild className="ripple-btn h-12 px-7 bg-transparent border text-white hover:bg-[#1A6B1A]/20 transition-all duration-300 font-semibold" size="lg" onClick={createRipple} style={{ borderColor: "rgba(26,107,26,0.5)" }}>
              <Link to="/auth">Join training</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
