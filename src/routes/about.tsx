import { createFileRoute } from "@tanstack/react-router";
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
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="gradient-hero text-primary-foreground py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">About MRsoft</h1>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">A team of engineers, trainers, and consultants building the digital backbone of modern organizations.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto prose-lg">
          <p className="text-lg text-muted-foreground leading-relaxed">
            M-R International (MRsoft) was founded with one purpose: help organizations adopt technology that actually works. We design, build, and support enterprise platforms across software, training, and consulting — for governments, universities, hospitals, and businesses across four continents.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Target, title: "Mission", desc: "Deliver transformative technology that helps organizations grow, serve, and innovate." },
            { icon: Eye, title: "Vision", desc: "Be Africa's most trusted partner for enterprise ICT and digital skills." },
            { icon: Heart, title: "Values", desc: "Integrity, craftsmanship, partnership, and continuous learning." },
          ].map(v => (
            <Card key={v.title} className="hover:shadow-elegant transition-smooth">
              <CardContent className="p-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{v.title}</h3>
                <p className="mt-2 text-muted-foreground">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
