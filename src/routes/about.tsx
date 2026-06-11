import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — MRsoft Digital Hub" },
      { name: "description", content: "Learn about M-R International, our mission, vision, and the team building enterprise ICT solutions." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold heading-accent-center-green">About MRsoft</h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">A team of engineers, trainers, and consultants building the digital backbone of modern organizations.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24 reveal-fade-up">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-white/70 leading-relaxed">
            M-R International (MRsoft) was founded with one purpose: help organizations adopt technology that actually works. We design, build, and support enterprise platforms across software, training, and consulting — for governments, universities, hospitals, and businesses across four continents.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Target, title: "Mission", desc: "Deliver transformative technology that helps organizations grow, serve, and innovate." },
            { icon: Eye, title: "Vision", desc: "Be Africa's most trusted partner for enterprise ICT and digital skills." },
            { icon: Heart, title: "Values", desc: "Integrity, craftsmanship, partnership, and continuous learning." },
          ].map(v => (
            <Card 
              key={v.title} 
              className="mrsoft-card"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardReset}
            >
              <CardContent className="p-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#1A5C1A]/20 text-[#1A5C1A] border border-[#1A5C1A]/30">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-white/60">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      <SiteFooter />
    </div>
  );
}
