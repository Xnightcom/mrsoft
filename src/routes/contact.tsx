import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { sendContactEmail, contactSchema } from "../lib/api/contact.functions";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createRipple } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — MRsoft Digital Hub" },
      { name: "description", content: "Get in touch with M-R International. Request a demo, a quote, or talk to our team." },
    ],
  }),
  component: ContactPage,
});

const schema = contactSchema;

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", service: "", budget: "", description: "" });
  
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

  const mut = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      await sendContactEmail({ data: parsed });
      const { error } = await supabase.from("service_requests").insert({
        name: parsed.name, email: parsed.email, company: parsed.company, phone: parsed.phone,
        service: parsed.service, budget: parsed.budget, description: parsed.description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request received. We'll be in touch within one business day.");
      setForm({ name: "", email: "", company: "", phone: "", service: "", budget: "", description: "" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof z.ZodError ? e.issues[0]?.message : e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      <SiteHeader />
      
      <section className="relative overflow-hidden bg-[#0a0a0a] border-b border-white/5 py-20 md:py-24 text-center text-white">
        <div className="absolute inset-0">
          <div className="radar-beam-red opacity-30" />
        </div>
        <div className="container relative mx-auto px-4 z-10">
          <h1 className="text-4xl md:text-5xl font-bold heading-accent-center-red">Let's build together</h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">Tell us about your project, and we'll get back within one business day.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-8 reveal-fade-up">
        <div className="space-y-6 md:col-span-1">
          {[
            { icon: Mail, title: "Email", value: "tambikingdavid@gmail.com" },
            { icon: Phone, title: "Phone", value: "+2347047407360" },
            { icon: MapPin, title: "HQ", value: "Lagos · Nairobi · London" },
          ].map(c => (
            <Card 
              key={c.title} 
              className="mrsoft-card border-none"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardReset}
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#1A5C1A]/20 text-[#1A5C1A] border border-[#1A5C1A]/30">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">{c.title}</div>
                  <div className="text-sm text-white/60">{c.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="md:col-span-2 mrsoft-card">
          <CardContent className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-white">Full name</Label>
                <Input id="name" className="bg-[#0A0A0A] border-white/10 text-white focus:border-[#CC0000] focus:ring-[#CC0000]/20" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input id="email" type="email" className="bg-[#0A0A0A] border-white/10 text-white focus:border-[#CC0000] focus:ring-[#CC0000]/20" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="company" className="text-white">Company</Label>
                <Input id="company" className="bg-[#0A0A0A] border-white/10 text-white focus:border-[#CC0000] focus:ring-[#CC0000]/20" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="phone" className="text-white">Phone</Label>
                <Input id="phone" className="bg-[#0A0A0A] border-white/10 text-white focus:border-[#CC0000] focus:ring-[#CC0000]/20" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-white">Service required</Label>
                <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white focus:border-[#CC0000]"><SelectValue placeholder="Choose service" /></SelectTrigger>
                  <SelectContent className="bg-[#111111] border-white/10 text-white">
                    {["Software Development","Web Applications","ICT Training","IT Consultancy","Cloud & Hosting","Enterprise Solution","Other"].map(s => <SelectItem key={s} value={s} className="focus:bg-[#CC0000] focus:text-white">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Budget range</Label>
                <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white focus:border-[#CC0000]"><SelectValue placeholder="Choose budget" /></SelectTrigger>
                  <SelectContent className="bg-[#111111] border-white/10 text-white">
                    {["< ₦5m","₦5m–₦25m","₦25m–₦125m","₦250m+"].map(s => <SelectItem key={s} value={s} className="focus:bg-[#CC0000] focus:text-white">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="desc" className="text-white">Project description</Label>
                <Textarea id="desc" rows={5} className="bg-[#0A0A0A] border-white/10 text-white focus:border-[#CC0000] focus:ring-[#CC0000]/20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" disabled={mut.isPending} className="ripple-btn w-full sm:w-auto bg-[#CC0000] hover:bg-[#AA0000] text-white border-none font-semibold transition-smooth" onClick={createRipple}>
                  {mut.isPending ? "Sending..." : "Send request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
      
      <SiteFooter />
    </div>
  );
}
