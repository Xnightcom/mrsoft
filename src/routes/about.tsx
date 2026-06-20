import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CardContent } from "@/components/ui/card";
import { TiltCard } from "@/components/TiltCard";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Target, Eye, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — MRsoft Digital Hub" },
      {
        name: "description",
        content:
          "Learn about M-R International, our mission, vision, and the team building enterprise ICT solutions.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  useScrollReveal();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section
        className="relative overflow-hidden py-20 md:py-28 text-center text-white"
        style={{ borderBottom: "1px solid rgba(26,107,26,0.3)" }}
      >
        <div className="container relative mx-auto px-4" style={{ zIndex: 5 }}>
          <h1 className="text-4xl md:text-5xl font-bold heading-accent-center-green heading-slide-in">
            About MRsoft
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto reveal-fade-up">
            A team of engineers, trainers, and consultants building the digital backbone of modern
            organizations.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24 reveal-fade-up">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-white/70 leading-relaxed">
            M-R International (MRsoft) was founded with one purpose: help organizations adopt
            technology that actually works. We design, build, and support enterprise platforms
            across software, training, and consulting — for governments, universities, hospitals,
            and businesses across four continents.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12 reveal-stagger">
          {[
            {
              icon: Target,
              title: "Mission",
              desc: "Deliver transformative technology that helps organizations grow, serve, and innovate.",
            },
            {
              icon: Eye,
              title: "Vision",
              desc: "Be Africa's most trusted partner for enterprise ICT and digital skills.",
            },
            {
              icon: Heart,
              title: "Values",
              desc: "Integrity, craftsmanship, partnership, and continuous learning.",
            },
          ].map((v) => (
            <div key={v.title} className="reveal-fade-up">
              <TiltCard>
                <CardContent className="p-8">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-xl bg-[#1A6B1A]/15 text-[#1A6B1A] border"
                    style={{ borderColor: "rgba(26,107,26,0.3)" }}
                  >
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{v.title}</h3>
                  <p className="mt-2 text-white/60">{v.desc}</p>
                </CardContent>
              </TiltCard>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
