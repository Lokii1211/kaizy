"use client";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

export default function TermsPage() {
  const { isDark } = useTheme();
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="pt-3 pb-4 px-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-1)" }}>
        <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-elevated)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Terms of Service</h1>
      </div>
      <div className="px-5 py-6 space-y-6 text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Last updated: 20 March 2026</p>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>1. About Kaizy</h2>
          <p>Kaizy is a technology platform that connects users (&quot;Hirers&quot;) with verified skilled workers (&quot;Workers&quot;) for home services including electrical, plumbing, carpentry, painting, cleaning, and mechanical work. Kaizy acts as an intermediary marketplace — we do not directly employ the workers.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>2. Eligibility</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years old to use Kaizy</li>
            <li>You must provide a valid Indian mobile number for OTP verification</li>
            <li>Workers must provide valid identity proof and skill verification</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>3. Booking & Services</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All bookings are subject to worker availability in your area</li>
            <li>Displayed prices are &quot;starting from&quot; estimates — final pricing depends on actual work required</li>
            <li>Workers will assess the job on-site and provide a final quote before starting</li>
            <li>You may cancel a booking at any time with a valid reason</li>
            <li>Workers have the right to decline a job if conditions are unsafe</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>4. Payment Terms</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payment is made directly to the worker upon job completion</li>
            <li>Accepted payment methods: Cash, UPI, or other agreed method</li>
            <li>Kaizy does not currently charge a platform fee to hirers</li>
            <li>Referral rewards and incentive bonuses are credited as per the published reward schedule</li>
            <li>Workers receive same-day payment for completed jobs</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>5. Worker Verification</h2>
          <p>All workers on Kaizy undergo a verification process including:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Aadhaar/PAN identity verification</li>
            <li>Phone number OTP verification</li>
            <li>Skill trade self-declaration</li>
            <li>KaizyScore computed from ratings, reviews, and job history</li>
          </ul>
          <p className="mt-2" style={{ color: "var(--text-3)" }}>Note: While we verify identity, Kaizy does not guarantee the quality of work. We recommend checking ratings and reviews before booking.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>6. Ratings & Reviews</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Both hirers and workers can rate each other (1-5 stars)</li>
            <li>Reviews must be honest and based on actual experience</li>
            <li>Kaizy reserves the right to remove abusive or fraudulent reviews</li>
            <li>Consistently low-rated workers may be deactivated</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>7. Cancellation & Refund</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hirers can cancel before worker arrival at no charge</li>
            <li>Cancellation after work has started requires mutual agreement</li>
            <li>Disputes about quality or pricing can be raised through the in-app dispute center</li>
            <li>Kaizy will mediate disputes but final resolution depends on the parties involved</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>8. Safety & SOS</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Both hirers and workers can trigger an SOS emergency alert</li>
            <li>SOS shares your live location with emergency contacts and local authorities</li>
            <li>False SOS triggers may result in account suspension</li>
            <li>Kaizy is not an emergency service — always call 112 for life-threatening emergencies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>9. Referral Program</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Each user gets a unique referral code stored persistently</li>
            <li>Rewards are credited after the referred user completes their first job</li>
            <li>Tier-based rewards: ₹100 (Bronze) to ₹300 (Platinum) per referral</li>
            <li>Milestone bonuses: ₹250 to ₹5,000 at specific referral counts</li>
            <li>Self-referrals and fraudulent referrals will result in account ban</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>10. Prohibited Activities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Using the platform for illegal activities</li>
            <li>Harassing workers, hirers, or support staff</li>
            <li>Creating fake accounts or fake reviews</li>
            <li>Attempting to bypass the platform for direct bookings</li>
            <li>Sharing inappropriate content in chat</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>11. Limitation of Liability</h2>
          <p>Kaizy acts as a marketplace connecting hirers and workers. We are not liable for:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Quality of work performed by workers</li>
            <li>Damage to property during service</li>
            <li>Personal injury during service</li>
            <li>Disputes between hirers and workers</li>
          </ul>
          <p className="mt-2">We recommend hirers ensure their property insurance covers third-party work.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>12. Governing Law</h2>
          <p>These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Coimbatore, Tamil Nadu.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>13. Contact</h2>
          <p className="font-bold" style={{ color: "var(--brand)" }}>📧 legal@kaizy.com</p>
          <p className="font-bold" style={{ color: "var(--brand)" }}>💬 KaizyBot (in-app support)</p>
        </section>
      </div>
    </div>
  );
}
