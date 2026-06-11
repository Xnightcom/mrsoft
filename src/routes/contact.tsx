import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { sendContactEmail, contactSchema } from "../lib/api/contact.functions";
import { SiteFooter } from "@/components/SiteFooter";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TiltCard } from "@/components/TiltCard";
import { useScrollReveal } from "@/hooks/useScrollReveal";
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

  useScrollReveal();

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
    <div className="min-h-screen flex flex-col bg-white text-[#060606]">
      <SiteHeader />

      <section className="relative overflow-hidden py-20 md:py-24 text-center text-[#060606]" style={{ borderBottom: "1px solid rgba(26,107,26,0.3)" }}>
        <div className="container relative mx-auto px-4" style={{ zIndex: 5 }}>
          <h1 className="text-4xl md:text-5xl font-bold heading-accent-center-red heading-slide-in text-[#060606]">Let's build together</h1>
          <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto reveal-fade-up">Tell us about your project, and we'll get back within one business day.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-8 reveal-fade-up">
        <div className="space-y-6 md:col-span-1 reveal-stagger">
          {[
            { icon: Mail, title: "Email", value: "tambikingdavid@gmail.com" },
            { icon: Phone, title: "Phone", value: "+2347047407360" },
            { icon: MapPin, title: "HQ", value: "Lagos · Nairobi · London" },
          ].map(c => (
            <div key={c.title} className="reveal-fade-up">
              <TiltCard className="tilt-card-light">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#1A6B1A]/10 text-[#1A6B1A] border" style={{ borderColor: "rgba(26,107,26,0.3)" }}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#060606]">{c.title}</div>
                    <div className="text-sm text-neutral-600">{c.value}</div>
                  </div>
                </CardContent>
              </TiltCard>
            </div>
          ))}
        </div>

        <TiltCard className="md:col-span-2 tilt-card-light">
          <CardContent className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-neutral-700">Full name</Label>
                <Input id="name" className="contact-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="email" className="text-neutral-700">Email</Label>
                <Input id="email" type="email" className="contact-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="company" className="text-neutral-700">Company</Label>
                <Input id="company" className="contact-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="phone" className="text-neutral-700">Phone</Label>
                <Input id="phone" className="contact-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-neutral-700">Service required</Label>
                <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                  <SelectTrigger className="contact-input"><SelectValue placeholder="Choose service" /></SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200 text-[#060606]">
                    {["Software Development","Web Applications","ICT Training","IT Consultancy","Cloud & Hosting","Enterprise Solution","Other"].map(s => <SelectItem key={s} value={s} className="focus:bg-[#CC0000] focus:text-white cursor-pointer">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-neutral-700">Budget range</Label>
                <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
                  <SelectTrigger className="contact-input"><SelectValue placeholder="Choose budget" /></SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200 text-[#060606]">
                    {["< ₦5m","₦5m–₦25m","₦25m–₦125m","₦250m+"].map(s => <SelectItem key={s} value={s} className="focus:bg-[#CC0000] focus:text-white cursor-pointer">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="desc" className="text-neutral-700">Project description</Label>
                <Textarea id="desc" rows={5} className="contact-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" disabled={mut.isPending} className="ripple-btn w-full sm:w-auto btn-primary-gradient" onClick={createRipple}>
                  {mut.isPending ? "Sending..." : "Send request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </TiltCard>
      </section>

      <SiteFooter />
    </div>
  );
}
