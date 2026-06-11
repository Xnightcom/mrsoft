import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t bg-[#060606] text-white" style={{ borderTopColor: "rgba(26,107,26,0.4)" }}>
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex justify-start">
            <Link to="/" className="inline-flex items-center justify-center transition-transform duration-300 hover:scale-[1.03]">
              <img
                src="/mrsoft-logo-new.png"
                alt="MRsoft Logo"
                className="object-contain logo-blend animate-logo-pulse"
                style={{ height: 36, width: "auto" }}
              />
            </Link>
          </div>
          <p className="mt-3 text-sm text-white/70 max-w-xs">
            Enterprise software, ICT training, and digital transformation for ambitious organizations.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white">Company</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-[#CC0000] transition-smooth">About</Link></li>
            <li><Link to="/services" className="hover:text-[#CC0000] transition-smooth">Services</Link></li>
            <li><Link to="/solutions" className="hover:text-[#CC0000] transition-smooth">Solutions</Link></li>
            <li><Link to="/contact" className="hover:text-[#CC0000] transition-smooth">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white">Platform</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/auth" className="hover:text-[#CC0000] transition-smooth">Student portal</Link></li>
            <li><Link to="/auth" className="hover:text-[#CC0000] transition-smooth">Client portal</Link></li>
            <li><Link to="/auth" className="hover:text-[#CC0000] transition-smooth">Admin</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white">Contact</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="hover:text-[#CC0000] transition-smooth cursor-pointer">tambikingdavid@gmail.com</li>
            <li className="hover:text-[#CC0000] transition-smooth cursor-pointer">+2347047407360</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-white/40" style={{ borderTopColor: "rgba(255,255,255,0.05)" }}>
        © {new Date().getFullYear()} M-R International. All rights reserved.
      </div>
    </footer>
  );
}
