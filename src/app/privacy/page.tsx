"use client";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

export default function PrivacyPage() {
  const { isDark } = useTheme();
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="pt-3 pb-4 px-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-1)" }}>
        <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-elevated)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Privacy Policy</h1>
      </div>
      <div className="px-5 py-6 space-y-6 text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Last updated: 20 March 2026</p>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>1. Information We Collect</h2>
          <p>When you use Kaizy, we collect:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Account Information:</strong> Phone number, name, profile photo (optional)</li>
            <li><strong>Location Data:</strong> GPS coordinates when you search for workers or during active bookings. We use this to find nearby workers and enable real-time tracking.</li>
            <li><strong>Booking Data:</strong> Service type, problem description, worker assignment, chat messages, ratings, and reviews.</li>
            <li><strong>Payment Data:</strong> Transaction records for cash payments. We do not store bank/card details.</li>
            <li><strong>Device Information:</strong> Device type, operating system, and app version for improving compatibility.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To match you with verified skilled workers near your location</li>
            <li>To enable real-time GPS tracking during active bookings</li>
            <li>To facilitate communication between hirers and workers via in-app chat</li>
            <li>To compute KaizyScore for workers (reliability & quality metric)</li>
            <li>To process referral rewards and incentive bonuses</li>
            <li>To send booking updates, payment confirmations, and SOS alerts</li>
            <li>To improve our matching algorithm and pricing engine</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>3. Location Data</h2>
          <p>We collect your GPS location <strong>only when you actively use the app</strong> (searching for workers or during an active booking). We never track your location in the background. You can deny location permission — in that case, you can manually enter your address.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>4. Data Sharing</h2>
          <p>We share your data only in these cases:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>With assigned workers:</strong> Your name, location, and service request when you book</li>
            <li><strong>Emergency contacts:</strong> If you trigger SOS, your location is shared with saved emergency contacts</li>
            <li><strong>Legal requirements:</strong> If required by law or court order</li>
          </ul>
          <p className="mt-2 font-bold" style={{ color: "var(--brand)" }}>We never sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>5. Data Security</h2>
          <p>All data is encrypted in transit (HTTPS/TLS) and at rest. Our database is hosted on Supabase with enterprise-grade security. OTP verification is used for all logins — we never store passwords.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>6. Data Retention</h2>
          <p>We retain your account data as long as your account is active. Booking history is retained for 2 years for dispute resolution. You can request deletion of your account and all associated data by contacting support.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>7. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Withdraw consent for location tracking</li>
            <li>Export your booking history</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>8. Children&apos;s Privacy</h2>
          <p>Kaizy is not intended for users under 18 years of age. We do not knowingly collect information from minors.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>9. Contact Us</h2>
          <p>For privacy-related questions or data deletion requests:</p>
          <p className="mt-1 font-bold" style={{ color: "var(--brand)" }}>📧 privacy@kaizy.in</p>
          <p className="font-bold" style={{ color: "var(--brand)" }}>📞 Support via KaizyBot (in-app)</p>
        </section>
      </div>
    </div>
  );
}
