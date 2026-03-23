"use client";
import Link from "next/link";

// ============================================================
// REFUND POLICY — Required for RBI/UPI compliance
// ============================================================

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Refund & Cancellation Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[11px] font-bold mb-1" style={{ color: "var(--brand)" }}>Last Updated: March 2026</p>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>
            This Refund &amp; Cancellation Policy applies to all services booked through the Kaizy platform.
            By using our services, you agree to the terms outlined below.
          </p>
        </div>

        {/* Section 1 */}
        <Section title="1. Cancellation by Hirer (Customer)" items={[
          "You may cancel a booking at any time before the worker starts the job.",
          "If cancelled within 2 minutes of booking → Full refund, no charges.",
          "If cancelled after worker has been dispatched but before arrival → ₹25 cancellation fee (to compensate worker travel).",
          "If cancelled after worker has arrived → 50% of the quoted price is charged as a cancellation fee.",
          "Once work has started (OTP shared), cancellation is not permitted. You must let the worker complete the job.",
        ]} />

        {/* Section 2 */}
        <Section title="2. Cancellation by Worker" items={[
          "Workers may cancel before departing for the job without penalty (first 2 times per week).",
          "Repeated cancellations (3+ per week) will reduce the worker's KaizyScore and limit job visibility.",
          "If a worker cancels after arriving, the hirer receives a full refund and the worker's reliability score is impacted.",
          "Kaizy will automatically re-dispatch the job to the next available worker.",
        ]} />

        {/* Section 3 */}
        <Section title="3. Refund Eligibility" items={[
          "Full Refund: If no worker is available within 30 minutes of booking.",
          "Full Refund: If the worker does not show up (no OTP verification within 15 minutes of ETA).",
          "Partial Refund (50%): If the job quality is unsatisfactory and a dispute is filed within 2 hours.",
          "No Refund: After job completion and OTP+payment confirmation.",
          "No Refund: For no-shows by the hirer (worker arrived but hirer was unreachable).",
        ]} />

        {/* Section 4 */}
        <Section title="4. Refund Process" items={[
          "All refunds are processed within 5–7 business days.",
          "UPI payments: Refund credited to the original UPI ID.",
          "Cash payments: Credited as Kaizy Wallet balance for future bookings.",
          "Razorpay-processed payments follow Razorpay's refund timelines.",
          "You will receive a WhatsApp/SMS notification when your refund is processed.",
        ]} />

        {/* Section 5 */}
        <Section title="5. Dispute Resolution" items={[
          "File a dispute within 2 hours of job completion via the app (My Bookings → Select Job → Report Issue).",
          "Kaizy support will review within 24 hours and contact both parties.",
          "Resolution options: Full refund, partial refund, re-service, or credit.",
          "If unresolved, escalate via email: support@kaizy.in",
          "Kaizy's decision on disputes is final.",
        ]} />

        {/* Section 6 */}
        <Section title="6. Worker Commission (₹5/Job)" items={[
          "A flat ₹5 platform fee is deducted from every completed job.",
          "This is non-refundable and covers platform operations, insurance pool, and support.",
          "Workers can view their commission history in the Earnings section.",
          "If pending commissions exceed ₹50, the worker must clear dues before accepting new jobs.",
        ]} />

        {/* Section 7 */}
        <Section title="7. Emergency (SOS) Bookings" items={[
          "Emergency bookings carry 1.5x pricing and are non-cancellable once dispatched.",
          "If emergency service is unsatisfactory, file a dispute for priority review (resolved within 4 hours).",
          "No cancellation fees apply if no worker accepts the emergency within 10 minutes.",
        ]} />

        {/* Contact */}
        <div className="rounded-2xl p-4" style={{ background: "var(--brand-tint)", border: "1px solid rgba(255,107,0,0.15)" }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: "var(--brand)" }}>📞 Need Help?</p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>
            For refund queries, contact us:
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>📧 Email: support@kaizy.in</p>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>💬 In-App: KaizyBot → &quot;Refund help&quot;</p>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>📱 WhatsApp: +91 XXXXX XXXXX</p>
          </div>
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
