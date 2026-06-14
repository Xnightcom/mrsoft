import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/solutions", label: "Solutions" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => setAuthed(!!data?.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, s: any) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#060606] border-b" style={{ borderBottomColor: "rgba(26,107,26,0.5)" }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center justify-start py-1">
          <img
            src="/mrsoft-logo-new.png"
            alt="MRsoft Logo"
            className="object-contain logo-blend animate-logo-pulse"
            style={{
              height: 36,
              width: "auto",
              mixBlendMode: "screen",
              background: "transparent",
              filter: "contrast(1.1) brightness(1.05)",
              border: "none",
              boxShadow: "none"
            }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-[#CC0000] transition-smooth nav-link-underline"
              activeProps={{ className: "px-4 py-2 text-sm font-semibold text-white nav-link-underline after:scale-x-100" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {authed ? (
            <Button asChild className="bg-[#CC0000] hover:bg-[#1A6B1A] text-white border-none font-semibold transition-all duration-300 ease-in-out rounded-md" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-white hover:text-[#CC0000] hover:bg-transparent" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild className="bg-[#CC0000] hover:bg-[#1A6B1A] text-white border-none font-semibold transition-all duration-300 ease-in-out rounded-md" size="sm" style={{ borderRadius: 6 }}>
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-white" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-[#060606]" style={{ borderTopColor: "rgba(26,107,26,0.3)" }}>
          <nav className="container mx-auto flex flex-col px-4 py-2">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-white/80 hover:text-[#CC0000]">
                {n.label}
              </Link>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)} className="py-3 text-sm font-semibold text-[#CC0000]">
              {authed ? "Dashboard" : "Sign in"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
