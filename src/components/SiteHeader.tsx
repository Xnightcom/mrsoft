import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createRipple } from "@/lib/utils";

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
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center justify-start py-1">
          <img 
            src="/mrsoft-logo-new.png" 
            alt="MRsoft Logo" 
            className="h-10 w-auto object-contain animate-logo-pulse"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-smooth nav-link-underline"
              activeProps={{ className: "px-4 py-2 text-sm font-semibold text-white nav-link-underline after:scale-x-100" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {authed ? (
            <Button asChild className="ripple-btn bg-[#CC0000] hover:bg-[#AA0000] text-white border-none font-semibold transition-smooth" size="sm" onClick={createRipple}>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild className="ripple-btn bg-[#CC0000] hover:bg-[#AA0000] text-white border-none font-semibold transition-smooth" size="sm" onClick={createRipple}>
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
        <div className="md:hidden border-t border-white/5 bg-[#0A0A0A]">
          <nav className="container mx-auto flex flex-col px-4 py-2">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-white/80 hover:text-white">
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
