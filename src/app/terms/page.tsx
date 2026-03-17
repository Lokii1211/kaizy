"use client";

import Link from "next/link";
import { FileText, ArrowLeft, Shield, CreditCard, AlertTriangle, Ban, Clock, Users, Scale, Gavel, HandCoins, BookOpen } from "lucide-react";

export default function TermsPage() {
  const lastUpdated = "March 15, 2026";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Link href="/settings" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="font-extrabold text-sm">Terms of Service</span>
      </div>

      <div className="px-4 space-y-4 mt-2">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold">Terms of Service</h1>
                <p className="text-[10px] text-gray-400">Last updated: {lastUpdated}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              By registering as a worker or hirer, you agree to these Terms. Please read carefully.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: BookOpen,
                title: "1. Definitions",
                content: `• **"Platform"** — ConnectOn web application, mobile app, and WhatsApp bot.
• **"Worker"** — An individual who registers to offer skilled trade services.
• **"Hirer"** — An individual or business that registers to book workers for jobs.
• **"Booking"** — A confirmed engagement between a worker and a hirer.
• **"Escrow"** — Money held by ConnectOn via Razorpay until job completion.
• **"ConnectPassport"** — A worker's verified digital work identity.
• **"ConnectScore"** — A worker's reliability score (range: 300–900).
• **"Platform Fee"** — 10% commission charged by ConnectOn on each booking.`
              },
              {
                icon: Users,
                title: "2. Eligibility & Registration",
                content: `**Who can register:**
• Workers must be 18 years or older.
• Hirers must be 18 years or older, or authorized representatives of registered businesses.
• Phone verification (OTP) is mandatory for all accounts.

**Account responsibilities:**
• You must provide accurate, truthful information during registration.
• You are responsible for all activity under your account.
• One phone number = one account. Multiple accounts will be suspended.
• ConnectOn reserves the right to reject or suspend accounts that violate these terms.

**Verification levels:**
• Level 1 (Basic): Phone OTP verified — can browse and apply.
• Level 2 (Verified): Aadhaar e-KYC verified — can accept bookings.
• Level 3 (Certified): DigiLocker skill certificates verified — priority matching.
• Higher verification = higher visibility and earning potential.`
              },
              {
                icon: CreditCard,
                title: "3. Payments & Platform Fee",
                content: `**How payments work:**
• When a hirer books a worker, the full job amount is collected and held in escrow via Razorpay.
• Escrow ensures the worker's payment is guaranteed — the hirer cannot withdraw once funded.
• Upon job completion and hirer confirmation, payment is released to the worker's UPI.

**Platform fee:**
• ConnectOn charges a 10% platform fee on every booking.
• Example: ₹1,800 job → Worker receives ₹1,620, ConnectOn retains ₹180.
• The fee is clearly shown to both parties before booking confirmation.
• GST (18%) applies on the platform fee where applicable.

**Settlement timeline:**
• Workers receive payment same-day (T+0) via UPI upon job completion.
• In rare cases, settlement may take up to T+2 business days due to bank processing.

**Refunds:**
• If a booking is cancelled by the hirer before job start: full refund within 5 business days.
• If a dispute is resolved in the hirer's favor: partial or full refund.
• Razorpay processes all refunds — ConnectOn does not hold any funds directly.`
              },
              {
                icon: AlertTriangle,
                title: "4. Cancellation Policy",
                content: `**Hirer cancellations:**
| When | Refund | Worker Compensation |
|---|---|---|
| 24+ hours before job | 100% refund | None |
| 2–24 hours before job | 100% refund | ₹100 cancellation fee to worker |
| Less than 2 hours before | 50% refund | 50% of job amount to worker |
| After worker has arrived | No refund | Full job amount to worker |

**Worker cancellations:**
| When | Consequence |
|---|---|
| 24+ hours before job | No penalty. Job goes to next matched worker |
| 2–24 hours before job | Warning. ConnectScore deducted by 5 points |
| Less than 2 hours before | ConnectScore deducted by 20 points |
| No-show (doesn't arrive) | 24-hour booking block + 30-point score deduction |
| 3 cancellations in 7 days | 48-hour booking suspension |

ConnectOn reserves the right to modify cancellation penalties to maintain platform quality.`
              },
              {
                icon: Gavel,
                title: "5. Dispute Resolution",
                content: `**Filing a dispute:**
• Either party can file a dispute within 24 hours of job completion.
• Disputes are filed via the platform or by messaging "DISPUTE" to ConnectBot.
• Both parties may submit evidence: photos, chat logs, job details.

**Resolution process:**
• Step 1: ConnectOn ops team reviews the dispute within 24 hours.
• Step 2: Both parties are contacted for their account of events.
• Step 3: Decision is communicated to both parties with reasoning.
• Step 4: Payment is adjusted based on the decision (release, partial refund, full refund).

**Possible outcomes:**
• Worker wins: Full payment released to worker.
• Hirer wins: Full or partial refund to hirer. Worker receives remaining amount (if any).
• Split decision: Payment split proportionally based on work completed.

**Appeal:**
• Either party may appeal once within 48 hours of the decision.
• Appeals are reviewed by a senior ops team member.
• The appeal decision is final.

**Fraudulent disputes:**
• Filing false disputes will result in account suspension.
• Repeated fraudulent disputes (3+) will result in permanent ban.`
              },
              {
                icon: Ban,
                title: "6. Prohibited Conduct",
                content: `**Workers must NOT:**
• Create fake profiles or use stolen identity for registration.
• Accept bookings with no intention of completing the job.
• Demand or accept payments outside the ConnectOn platform.
• Share other workers' contact information with hirers.
• Upload fake certifications or skill claims.
• Engage in harassment, threats, or discrimination.

**Hirers must NOT:**
• Post fake job listings to collect worker information.
• Withhold payment confirmation after job completion.
• Contact workers outside the platform to avoid paying platform fees.
• Discriminate against workers based on caste, religion, gender, or region.
• Use threatening language or behavior.

**Both parties must NOT:**
• Attempt to manipulate ratings with fake reviews.
• Create multiple accounts.
• Reverse-engineer or scrape the platform.
• Violate any applicable Indian law.

**Consequences:** Violations may result in warnings, temporary suspension, permanent ban, or legal action, depending on severity.`
              },
              {
                icon: Shield,
                title: "7. Limitation of Liability",
                content: `• ConnectOn is a marketplace platform — we connect workers and hirers. We do NOT employ workers and are NOT liable for the quality of work performed.
• ConnectOn does NOT guarantee job outcomes, worker availability, or payment timelines (beyond our stated SLAs).
• Our maximum liability for any claim related to a booking is limited to the platform fee collected for that specific booking.
• ConnectOn is NOT liable for damages caused by workers during a job. Workers are independent service providers.
• We recommend hirers independently verify workers for high-value projects (>₹10,000).

**Insurance:** ConnectOn offers optional job insurance (₹5–₹50 per booking) that covers accidental damage during the job. This is separate from platform liability.`
              },
              {
                icon: HandCoins,
                title: "8. Intellectual Property",
                content: `• The ConnectOn name, logo, design, and technology are proprietary.
• ConnectPassport data belongs to the worker — you can export it at any time.
• Reviews and ratings remain on the platform even after account deletion (anonymized).
• Workers retain ownership of their skill photos, work portfolio, and certifications.
• By posting reviews, you grant ConnectOn a non-exclusive license to display them.`
              },
              {
                icon: Scale,
                title: "9. Governing Law & Jurisdiction",
                content: `• These Terms are governed by the laws of India.
• Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Coimbatore, Tamil Nadu.
• For disputes below ₹10,000: resolved via ConnectOn internal dispute resolution.
• For disputes above ₹10,000: arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator appointed by ConnectOn.

**Contact:**
ConnectOn Technologies Pvt. Ltd.
Coimbatore, Tamil Nadu, India
Email: legal@connecton.in
Phone: +91 98765 43210`
              },
              {
                icon: Clock,
                title: "10. Changes to Terms",
                content: `• ConnectOn may update these Terms from time to time.
• We will notify you via WhatsApp and/or app notification at least 7 days before changes take effect.
• Continued use of the platform after changes = acceptance of updated Terms.
• If you disagree with changes, you may delete your account (see Privacy Policy for data deletion).
• Material changes (payment terms, liability, fees) require re-consent via the app.`
              },
            ].map((section, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1E293B]/10 flex items-center justify-center">
                    <section.icon className="w-4 h-4 text-[#1E293B]" />
                  </div>
                  <h2 className="text-sm font-extrabold">{section.title}</h2>
                </div>
                <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
