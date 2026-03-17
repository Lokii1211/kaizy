"use client";

import Link from "next/link";
import {
  Zap,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ArrowUpRight,
  Heart,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden" style={{ background: "var(--gradient-dark)" }}>
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FF6B2C]/30 to-transparent" />
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-[#FF6B2C]/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-[#3B82F6]/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        {/* Top Section — CTA */}
        <div className="glass rounded-3xl p-8 md:p-12 mb-16 text-center">
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform India&apos;s Workforce?
          </h3>
          <p className="text-white/60 max-w-2xl mx-auto mb-8 text-lg">
            Join 55 crore skilled workers building their digital work identity. Start earning more. Start getting found.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/worker" className="btn-primary !py-3 !px-8 !text-base">
              I&apos;m a Worker
              <ArrowUpRight className="w-5 h-5" />
            </Link>
            <Link href="/register/hirer" className="btn-accent !py-3 !px-8 !text-base">
              I&apos;m Hiring
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">
                  Konnect<span className="text-[#FF6B2C]">On</span>
                </span>
                <p className="text-[10px] text-white/40 -mt-1">The Bridge to Work</p>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              India&apos;s Workforce Operating System. Verified work identity, instant job matching, same-day UPI payments.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#FF6B2C]/20 flex items-center justify-center text-white/50 hover:text-[#FF6B2C] transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {[
            {
              title: "For Workers",
              links: [
                { name: "Register", href: "/register/worker" },
                { name: "Find Jobs", href: "/marketplace" },
                { name: "KonnectPassport", href: "#" },
                { name: "KonnectScore", href: "#" },
                { name: "Skill Courses", href: "#" },
              ],
            },
            {
              title: "For Businesses",
              links: [
                { name: "Post a Job", href: "/register/hirer" },
                { name: "Find Workers", href: "/marketplace" },
                { name: "Team Booking", href: "#" },
                { name: "Contractor Portal", href: "#" },
                { name: "Enterprise", href: "#" },
              ],
            },
            {
              title: "Platform",
              links: [
                { name: "How It Works", href: "#" },
                { name: "KaizyPay", href: "#" },
                { name: "Pricing", href: "#" },
                { name: "API Docs", href: "#" },
                { name: "Trust & Safety", href: "#" },
              ],
            },
            {
              title: "Company",
              links: [
                { name: "About Us", href: "#" },
                { name: "Careers", href: "#" },
                { name: "Blog", href: "#" },
                { name: "Press", href: "#" },
                { name: "Contact", href: "#" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-[#FF6B2C] text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Row */}
        <div className="flex flex-wrap gap-6 py-6 border-t border-white/10 mb-6">
          <a href="tel:+919876543210" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
            <Phone className="w-4 h-4" />
            +91 98765 43210
          </a>
          <a href="mailto:hello@konnecton.in" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
            <Mail className="w-4 h-4" />
            hello@konnecton.in
          </a>
          <span className="flex items-center gap-2 text-white/50 text-sm">
            <MapPin className="w-4 h-4" />
            Coimbatore, Tamil Nadu, India
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
          <p className="text-white/40 text-sm flex items-center gap-1">
            © {currentYear} KonnectOn. Made with <Heart className="w-3.5 h-3.5 text-[#FF6B2C] fill-[#FF6B2C]" /> in India
          </p>
          <div className="flex gap-6">
            {[
              { text: "Privacy Policy", href: "/privacy" },
              { text: "Terms of Service", href: "/terms" },
              { text: "DPDP Compliance", href: "/privacy" },
            ].map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
