import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="gradient-hero text-primary-foreground py-20 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Let's build together</h1>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">Tell us about your project, and we'll get back within one business day.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        <div className="space-y-6 md:col-span-1">
          {[
            { icon: Mail, title: "Email", value: "tambikingdavid@gmail.com" },
            { icon: Phone, title: "Phone", value: "+2347047407360" },
            { icon: MapPin, title: "HQ", value: "Lagos · Nairobi · London" },
          ].map(c => (
            <Card key={c.title}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary text-primary-foreground"><c.icon className="h-5 w-5" /></div>
                <div><div className="font-semibold">{c.title}</div><div className="text-sm text-muted-foreground">{c.value}</div></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="md:col-span-2 shadow-elegant">
          <CardContent className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="grid sm:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Full name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><Label htmlFor="company">Company</Label><Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div>
                <Label>Service required</Label>
                <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose service" /></SelectTrigger>
                  <SelectContent>
                    {["Software Development","Web Applications","ICT Training","IT Consultancy","Cloud & Hosting","Enterprise Solution","Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget range</Label>
                <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose budget" /></SelectTrigger>
                  <SelectContent>
                    {["< ₦5m","₦5m–₦25m","₦25m–₦125m","₦250m+"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label htmlFor="desc">Project description</Label><Textarea id="desc" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="sm:col-span-2">
                <Button type="submit" variant="hero" size="lg" disabled={mut.isPending} className="w-full sm:w-auto">
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
