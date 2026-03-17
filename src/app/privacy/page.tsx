"use client";

import Link from "next/link";
import { Zap, Shield, Lock, Database, UserCheck, Eye, Trash2, Bell, Scale, ArrowLeft, FileText, Globe } from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "March 15, 2026";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Link href="/settings" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="font-extrabold text-sm">Privacy Policy</span>
      </div>

      <div className="px-4 space-y-4 mt-2">

          {/* Header */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold">Privacy Policy</h1>
                <p className="text-[10px] text-gray-400">Last updated: {lastUpdated}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              ConnectOn is committed to protecting your privacy. Compliant with the <strong>DPDP Act, 2023</strong>.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" /> DPDP Compliant
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> AES-256
              </span>
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                <Globe className="w-2.5 h-2.5" /> India Only
              </span>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {[
              {
                icon: Database,
                title: "1. What Data We Collect",
                content: `**Identity Data:** Name, phone number, profile photo, city, state. For KYC-verified workers: last 4 digits of Aadhaar only (we NEVER store your full Aadhaar number).

**Professional Data:** Trade/skill, experience, certifications (via DigiLocker), work history, ratings, KonnectScore.

**Financial Data:** UPI ID (encrypted at rest using AES-256), payment transaction records, escrow history, earnings data.

**Device & Usage Data:** Device type, app version, IP address, pages visited, features used. We use this ONLY to improve app performance on budget phones.

**Location Data:** City and locality for job matching. We do NOT track your GPS continuously. Location is captured ONLY when you mark "arrived" at a job site.

**Communication Data:** WhatsApp messages with ConnectBot (for support improvement only). We do NOT read your personal WhatsApp messages.`
              },
              {
                icon: FileText,
                title: "2. Why We Collect This Data (Purpose Limitation)",
                content: `We collect your data ONLY for these specific purposes:

• **Job Matching:** To connect workers with hirers based on skill, location, and availability.
• **Payment Processing:** To process UPI escrow payments via Razorpay.
• **Identity Verification:** To ensure trust and safety on the platform (KYC via Aadhaar e-KYC).
• **KonnectScore:** To calculate your work reliability score for NBFC loan eligibility (ONLY with your explicit consent).
• **Platform Improvement:** To fix bugs, improve loading speed, and enhance mobile experience.
• **Legal Compliance:** To comply with Indian tax laws and DPDP Act requirements.

We will NEVER sell your personal data to third parties. We will NEVER use your data for purposes you haven't consented to.`
              },
              {
                icon: UserCheck,
                title: "3. Your Consent",
                content: `Under the DPDP Act 2023, we collect your data based on:

• **Explicit Consent:** You agree to this policy when you register. Consent is granular — you can opt-in or opt-out of specific features (e.g., KonnectScore sharing with NBFCs).
• **Legitimate Purpose:** Some processing is necessary for the service to work (e.g., we need your phone number to send OTP).
• **Revocable:** You can withdraw consent at any time by contacting privacy@connecton.in or typing "DELETE MY DATA" to ConnectBot on WhatsApp.

**For workers under 18:** We do not knowingly collect data from individuals under 18 years old. If you are under 18, please do not register.`
              },
              {
                icon: Eye,
                title: "4. Your Rights (Data Principal Rights)",
                content: `Under the DPDP Act 2023, you have the right to:

• **Access:** Request a copy of all data we hold about you (delivered within 72 hours).
• **Correction:** Fix any inaccurate information in your profile at any time.
• **Erasure:** Request deletion of your personal data. We will delete within 30 days. Note: anonymized booking records may be retained for 7 years for tax compliance.
• **Withdraw Consent:** Opt out of any data processing at any time (this may limit some features).
• **Nominate:** Designate someone to exercise your data rights in case of death or incapacity.
• **Grievance:** File a complaint with our Data Protection Officer or the Data Protection Board of India.

**How to exercise:** Email privacy@connecton.in or WhatsApp +91 98765 43210 with subject "Data Request".`
              },
              {
                icon: Lock,
                title: "5. Data Security",
                content: `We protect your data with:

• **Encryption at Rest:** All sensitive data (UPI IDs, Aadhaar last-4, payment records) is encrypted using AES-256 with keys managed via AWS KMS.
• **Encryption in Transit:** All API communication uses TLS 1.3. No unencrypted data leaves our servers.
• **Access Control:** Only authorized team members can access personal data. All access is logged and audited.
• **Aadhaar Security:** We NEVER store full Aadhaar numbers. We store only the last 4 digits for display purposes. Aadhaar verification is done via UIDAI-approved partners (Digio/Signzy).
• **Data Localization:** All data is stored in AWS Mumbai (ap-south-1) region. Your data never leaves India.
• **Breach Response:** In the event of a data breach, we will notify CERT-In within 6 hours and affected users within 72 hours, as required by law.`
              },
              {
                icon: Trash2,
                title: "6. Data Retention & Deletion",
                content: `| Data Type | Retention Period | After Expiry |
|---|---|---|
| Profile data | Until account deletion | Permanently deleted |
| Booking records | 7 years (tax compliance) | Anonymized, then deleted |
| Payment records | 7 years (RBI requirement) | Anonymized, then deleted |
| OTP logs | 24 hours | Auto-deleted |
| Chat transcripts | 90 days | Auto-deleted |
| Location data | 30 days | Auto-deleted |
| KonnectScore | Until consent withdrawal | Permanently deleted |

When you delete your account:
• Personal data is marked for deletion immediately
• Actual deletion happens within 30 days
• Anonymized records (booking ID, amount, date — no PII) may be kept for legal compliance`
              },
              {
                icon: Bell,
                title: "7. Third-Party Sharing",
                content: `We share your data ONLY with:

• **Razorpay:** Payment processing (UPI ID, transaction amounts). Governed by their PCI-DSS compliance.
• **Gupshup/Twilio:** WhatsApp message delivery (phone number, message content). They cannot store your data.
• **NBFC Partners:** KonnectScore and work history, ONLY if you explicitly consent to a loan application.
• **Government:** If required by law (court order, tax audit, UIDAI audit).

We do NOT share data with:
• Advertisers
• Data brokers
• Social media platforms
• Any entity for marketing purposes`
              },
              {
                icon: Scale,
                title: "8. Grievance Redressal",
                content: `**Data Protection Officer:**
Name: [To be appointed]
Email: dpo@connecton.in
Response time: Within 48 hours

**Grievance Officer:**
Email: grievance@connecton.in
Phone: +91 98765 43210 (WhatsApp)
Response time: Within 30 days

**Escalation:**
If unsatisfied with our response, you may file a complaint with the Data Protection Board of India at dpb.gov.in.

**Contact Us:**
ConnectOn Technologies Pvt. Ltd.
Coimbatore, Tamil Nadu, India
Email: privacy@connecton.in`
              },
            ].map((section, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center">
                    <section.icon className="w-4 h-4 text-[#FF6B2C]" />
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
