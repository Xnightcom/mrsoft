import { Link } from "@tanstack/react-router";
import { Cpu } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-lg gradient-primary"><Cpu className="h-5 w-5" /></span>
            MRsoft
          </div>
          <p className="mt-3 text-sm text-sidebar-foreground/70 max-w-xs">
            Enterprise software, ICT training, and digital transformation for ambitious organizations.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/solutions">Solutions</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            <li><Link to="/auth">Student portal</Link></li>
            <li><Link to="/auth">Client portal</Link></li>
            <li><Link to="/auth">Admin</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            <li>tambikingdavid@gmail.com</li>
            <li>+2347047407360</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-5 text-center text-xs text-sidebar-foreground/60">
        © {new Date().getFullYear()} M-R International. All rights reserved.
      </div>
    </footer>
  );
}
