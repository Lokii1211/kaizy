"use client";

import Link from "next/link";

// ============================================================
// FOOTER v10.0 — Stitch "Digital Artisan" Design
// Dark gradient · No lucide-react · Tonal surfaces
// ============================================================

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0a0a, #131313)" }}>
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,107,0,0.3), transparent)" }} />
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full blur-3xl" style={{ background: "rgba(255,107,0,0.04)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        {/* CTA */}
        <div className="rounded-[28px] p-8 md:p-12 mb-16 text-center"
             style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)" }}>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Epilogue', sans-serif" }}>
            Ready to Transform India&apos;s Workforce?
          </h3>
          <p className="text-white/50 max-w-2xl mx-auto mb-8 text-lg">
            Join 55 crore skilled workers building their digital work identity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/worker"
                  className="px-8 py-3 rounded-[16px] text-base font-bold text-white inline-flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
              I&apos;m a Worker ↗
            </Link>
            <Link href="/register/hirer"
                  className="px-8 py-3 rounded-[16px] text-base font-bold inline-flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}>
              I&apos;m Hiring ↗
            </Link>
          </div>
        </div>

        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px]"
                   style={{ background: "var(--gradient-cta)" }}>⚡</div>
              <div>
                <span className="text-xl font-bold text-white">kai<span style={{ color: "var(--brand)" }}>zy</span></span>
                <p className="text-[10px] text-white/40 -mt-1">India&apos;s Workforce OS</p>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Verified work identity, instant job matching, same-day UPI payments.
            </p>
            <div className="flex gap-3">
              {["📘", "🐦", "📸", "💼", "📺"].map((icon, i) => (
                <a key={i} href="#"
                   className="w-9 h-9 rounded-lg flex items-center justify-center transition-all text-[14px]"
                   style={{ background: "rgba(255,255,255,0.05)" }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {[
            { title: "For Workers", links: [
              { name: "Register", href: "/register/worker" },
              { name: "Find Jobs", href: "/marketplace" },
              { name: "KaizyPass", href: "/worker/profile" },
              { name: "KaizyScore", href: "#" },
              { name: "Skill Courses", href: "/konnectlearn" },
            ]},
            { title: "For Businesses", links: [
              { name: "Post a Job", href: "/post-job" },
              { name: "Find Workers", href: "/marketplace" },
              { name: "Team Booking", href: "#" },
              { name: "Contractor Portal", href: "/contractor" },
              { name: "Enterprise", href: "#" },
            ]},
            { title: "Platform", links: [
              { name: "How It Works", href: "/#how-it-works" },
              { name: "KaizyPay", href: "/konnectpay" },
              { name: "Pricing", href: "/pricing" },
              { name: "API Docs", href: "#" },
              { name: "Trust & Safety", href: "#" },
            ]},
            { title: "Company", links: [
              { name: "About Us", href: "#" },
              { name: "Careers", href: "#" },
              { name: "Blog", href: "#" },
              { name: "Press", href: "#" },
              { name: "Contact", href: "#" },
            ]},
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href}
                          className="text-white/50 hover:text-white text-sm transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-wrap gap-6 py-6 mb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <a href="tel:+919876543210" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
            📞 +91 98765 43210
          </a>
          <a href="mailto:support@kaizy.com" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
            ✉️ support@kaizy.com
          </a>
          <span className="flex items-center gap-2 text-white/50 text-sm">
            📍 Coimbatore, Tamil Nadu, India
          </span>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-white/40 text-sm flex items-center gap-1">
            © {currentYear} Kaizy. Made with ❤️ in India
          </p>
          <div className="flex gap-6">
            {[
              { text: "Privacy Policy", href: "/privacy" },
              { text: "Terms of Service", href: "/terms" },
              { text: "DPDP Compliance", href: "/privacy" },
            ].map((link) => (
              <Link key={link.text} href={link.href}
                    className="text-white/40 hover:text-white/70 text-sm transition-colors">
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
