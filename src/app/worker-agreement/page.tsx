"use client";
import Link from "next/link";

// ============================================================
// WORKER AGREEMENT — Partner Terms for Kaizy Workers
// ============================================================

export default function WorkerAgreementPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Worker Partner Agreement</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {/* Important Banner */}
        <div className="rounded-2xl p-4" style={{ background: "var(--brand-tint)", border: "1px solid rgba(255,107,0,0.15)" }}>
          <p className="text-[12px] font-bold mb-1" style={{ color: "var(--brand)" }}>📋 Independent Partner Agreement</p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>
            Workers on Kaizy are independent partners — not employees. This agreement outlines your rights,
            responsibilities, and how the platform works for you.
          </p>
          <p className="text-[10px] mt-2 font-semibold" style={{ color: "var(--text-3)" }}>
            Effective: March 2026 · Version 1.0
          </p>
        </div>

        <Section title="1. Your Role as a Kaizy Partner" items={[
          "You are an independent service provider, not an employee of Kaizy.",
          "You choose when to go online, which jobs to accept or decline, and your working hours.",
          "Kaizy provides a technology platform to connect you with hirers — we do not supervise your work.",
          "You are responsible for your own tools, equipment, and transport.",
        ]} />

        <Section title="2. Eligibility Requirements" items={[
          "Minimum age: 18 years.",
          "Valid Aadhaar card or government-issued photo ID.",
          "Active UPI ID for receiving payments.",
          "Relevant trade skills (self-declared, verified through KaizyScore over time).",
          "No active criminal cases or fraud history on the platform.",
        ]} />

        <Section title="3. KaizyScore & Verification" items={[
          "Your KaizyScore (300–900) is calculated from: job completion rate, ratings, response time, disputes, and certifications.",
          "Higher KaizyScore = more job visibility, priority alerts, and eligibility for loans/insurance.",
          "You can improve your score by: completing jobs, maintaining 4+ ratings, responding fast, and uploading certifications.",
          "KaizyScore is re-calculated after every completed job.",
        ]} />

        <Section title="4. Job Acceptance & Completion" items={[
          "When online, you'll receive job alerts for nearby jobs matching your trade.",
          "You have 45 seconds to accept or decline each alert.",
          "Once accepted, you must complete the job. Repeated no-shows will reduce your KaizyScore.",
          "Share OTP with the hirer to verify your arrival before starting work.",
          "Take before/after photos of your work for quality verification.",
          "Mark the job as 'Completed' only after finishing all requested work.",
        ]} />

        <Section title="5. Payments & Commission" items={[
          "Kaizy charges a flat ₹5 platform fee per completed job (commission).",
          "For cash payments: Collect full amount from hirer. ₹5 commission is tracked and payable weekly.",
          "For UPI payments: Your payout = job amount - ₹5 commission (auto-deducted).",
          "Payments are processed within 24 hours for UPI bookings.",
          "If pending commission exceeds ₹50, you must clear the balance before accepting new jobs.",
          "Tips from hirers are 100% yours — no commission on tips.",
        ]} />

        <Section title="6. Code of Conduct" items={[
          "Treat every hirer with respect and professionalism.",
          "Arrive on time and communicate delays proactively.",
          "Do not ask for payments outside the Kaizy platform.",
          "Do not share hirer's personal information (phone, address) with anyone.",
          "Maintain cleanliness at the work site and clean up after your job.",
          "No alcohol, drugs, or weapons while on a job.",
          "No discrimination based on gender, caste, religion, or economic status.",
        ]} />

        <Section title="7. Safety & Emergency" items={[
          "In case of emergency, use the SOS button (available on your dashboard).",
          "Kaizy will dispatch nearby help and alert emergency contacts.",
          "Report unsafe working conditions through the app.",
          "Kaizy provides an incident protection pool (funded by commission) for on-job injuries.",
          "You are encouraged to carry basic safety equipment for your trade.",
        ]} />

        <Section title="8. Suspension & Termination" items={[
          "Kaizy may suspend your account for: fraud, harassment, repeated cancellations, fake reviews, or safety violations.",
          "You will be notified via WhatsApp/SMS with the reason for suspension.",
          "Appeal within 7 days by contacting support@kaizy.in.",
          "You may deactivate your account at any time from Settings. Pending commissions must be cleared first.",
          "Deactivation does not delete your KaizyScore — you can reactivate anytime.",
        ]} />

        <Section title="9. Intellectual Property" items={[
          "You retain ownership of your work and skills.",
          "Kaizy owns the platform, brand, KaizyScore algorithm, and related technology.",
          "Job photos uploaded to Kaizy may be used for quality verification and platform improvement.",
          "You grant Kaizy a non-exclusive license to display your profile, reviews, and photos on the platform.",
        ]} />

        <Section title="10. Dispute Resolution" items={[
          "Disputes between you and hirers are mediated by Kaizy support.",
          "Kaizy's decision on disputes is final and binding.",
          "For unresolved issues, contact support@kaizy.in.",
          "This agreement is governed by the laws of India. Courts in Coimbatore, Tamil Nadu shall have exclusive jurisdiction.",
        ]} />

        {/* Acceptance */}
        <div className="rounded-2xl p-4" style={{ background: "var(--success-tint)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-[12px] font-bold mb-1" style={{ color: "var(--success)" }}>✅ By using Kaizy as a worker partner, you agree to these terms.</p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>
            This agreement was accepted when you registered as a worker. You can review it anytime from Settings → Worker Agreement.
          </p>
        </div>

        <p className="text-center text-[9px] py-4" style={{ color: "var(--text-3)" }}>
          Kaizy Technologies · Coimbatore, Tamil Nadu · CIN: UXXXXX
        </p>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
      <p className="text-[13px] font-bold mb-2" style={{ color: "var(--text-1)" }}>{title}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[10px] mt-0.5 shrink-0" style={{ color: "var(--brand)" }}>●</span>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
