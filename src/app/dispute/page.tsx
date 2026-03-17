"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, Camera, MessageCircle, Clock, CheckCircle2,
  XCircle, FileText, Shield, Scale, Upload, Send, ChevronDown,
  ChevronRight, Zap, Loader2, Info, Star,
} from "lucide-react";

type DisputeStep = "select" | "evidence" | "submit" | "tracking";
type DisputeType = "quality" | "incomplete" | "noshow" | "overcharge" | "damage" | "other";

interface DisputeCase {
  id: string;
  status: "open" | "investigating" | "resolved" | "appeal";
  type: DisputeType;
  booking: string;
  filed: string;
  sla: string;
  resolution?: string;
}

const disputeTypes: { type: DisputeType; label: string; icon: string; desc: string }[] = [
  { type: "quality", label: "Poor Work Quality", icon: "⚠️", desc: "Work done but quality was not as expected" },
  { type: "incomplete", label: "Incomplete Work", icon: "❌", desc: "Worker left before completing the full job" },
  { type: "noshow", label: "Worker No-Show", icon: "👻", desc: "Worker never arrived at the job location" },
  { type: "overcharge", label: "Overcharged", icon: "💰", desc: "Worker charged extra beyond the agreed amount" },
  { type: "damage", label: "Property Damage", icon: "🔨", desc: "Worker caused damage during the job" },
  { type: "other", label: "Other Issue", icon: "📝", desc: "Something else went wrong" },
];

const demoCases: DisputeCase[] = [
  {
    id: "DIS-2024-0847",
    status: "investigating",
    type: "quality",
    booking: "BK-2024-1293",
    filed: "2 hours ago",
    sla: "22 hours remaining",
  },
  {
    id: "DIS-2024-0832",
    status: "resolved",
    type: "incomplete",
    booking: "BK-2024-1250",
    filed: "3 days ago",
    sla: "Resolved in 18 hrs",
    resolution: "Partial refund of ₹900 issued to hirer. Worker received ₹600 for completed portion.",
  },
];

export default function DisputePage() {
  const [step, setStep] = useState<DisputeStep>("select");
  const [selectedType, setSelectedType] = useState<DisputeType | null>(null);
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [loading, setLoading] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("tracking");
    }, 2000);
  };

  const statusColors = {
    open: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
    investigating: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    resolved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    appeal: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/hirer" className="p-2 rounded-xl hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">Dispute Center</h1>
              <p className="text-xs text-[var(--color-muted)]">Resolution within 24 hours</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FF6B2C]" />
            <span className="text-xs font-semibold text-[#FF6B2C]">Protected</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex bg-[#F8FAFC] rounded-2xl p-1 mb-6 border border-[#E2E8F0]">
          {(["new", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white shadow-sm text-[var(--foreground)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {tab === "new" ? "⚡ File Dispute" : "📋 My Disputes"}
            </button>
          ))}
        </div>

        {activeTab === "new" && (
          <>
            {/* SLA Banner */}
            <div className="bg-gradient-to-r from-[#FF6B2C]/10 to-[#3B82F6]/10 rounded-2xl p-4 mb-6 flex items-center gap-3 border border-[#FF6B2C]/20">
              <Clock className="w-8 h-8 text-[#FF6B2C]" />
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">24-Hour Resolution Guarantee</p>
                <p className="text-xs text-[var(--color-muted)]">Our ops team reviews every dispute with both parties. Evidence-based decisions only.</p>
              </div>
            </div>

            {/* Step 1: Select Dispute Type */}
            {step === "select" && (
              <div className="space-y-3 animate-slide-up">
                <h2 className="text-lg font-bold mb-1">What went wrong?</h2>
                <p className="text-sm text-[var(--color-muted)] mb-4">Select the type of issue with your recent booking.</p>

                {/* Booking Selector */}
                <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] mb-4">
                  <p className="text-xs text-[var(--color-muted)] mb-2">Disputed Booking</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center text-sm font-bold text-[#FF6B2C]">RK</div>
                      <div>
                        <p className="font-semibold text-sm">Shop Rewiring — Raju Kumar</p>
                        <p className="text-xs text-[var(--color-muted)]">BK-2024-1293 • ₹1,800 • Today, 10 AM</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>
                </div>

                {disputeTypes.map((dt) => (
                  <button
                    key={dt.type}
                    onClick={() => { setSelectedType(dt.type); setStep("evidence"); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedType === dt.type
                        ? "border-[#FF6B2C] bg-[#FF6B2C]/5"
                        : "border-[#E2E8F0] bg-white hover:border-[#FF6B2C]/30"
                    }`}
                  >
                    <span className="text-2xl">{dt.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{dt.label}</p>
                      <p className="text-xs text-[var(--color-muted)]">{dt.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Evidence */}
            {step === "evidence" && (
              <div className="space-y-4 animate-slide-up">
                <button onClick={() => setStep("select")} className="flex items-center gap-1 text-sm text-[var(--color-muted)] mb-2 hover:text-[var(--foreground)]">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <h2 className="text-lg font-bold">Add Evidence</h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Help our ops team understand the issue. More evidence = faster resolution.
                </p>

                {/* Selected type badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF6B2C]/10 rounded-full text-sm font-semibold text-[#FF6B2C]">
                  {disputeTypes.find(d => d.type === selectedType)?.icon} {disputeTypes.find(d => d.type === selectedType)?.label}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Describe the issue *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="input !rounded-2xl resize-none"
                    placeholder="Tell us what happened in detail. Be specific about what was wrong..."
                  />
                  <p className="text-xs text-[var(--color-muted)] mt-1">{description.length}/500 characters</p>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photos / Evidence</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <button
                        key={i}
                        className="aspect-square rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-white flex flex-col items-center justify-center gap-1 hover:border-[#FF6B2C] transition-colors"
                      >
                        <Camera className="w-5 h-5 text-[var(--color-muted)]" />
                        <span className="text-[10px] text-[var(--color-muted)]">Add Photo</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expected resolution */}
                <div>
                  <label className="block text-sm font-medium mb-2">What resolution do you expect?</label>
                  <div className="space-y-2">
                    {[
                      { label: "Full refund", desc: "₹1,800 back to my payment method" },
                      { label: "Partial refund", desc: "Refund for incomplete/poor portion" },
                      { label: "Redo the job", desc: "Same worker fixes the issues, no extra charge" },
                      { label: "Different worker", desc: "Assign a new worker to complete the job" },
                    ].map((opt) => (
                      <label key={opt.label} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0] cursor-pointer hover:border-[#FF6B2C]/30 transition-colors">
                        <input type="radio" name="resolution" className="accent-[#FF6B2C]" />
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-[var(--color-muted)]">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!description || loading}
                  className="btn-primary !w-full !justify-center !py-4"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Dispute...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Submit Dispute</>
                  )}
                </button>

                <p className="text-xs text-center text-[var(--color-muted)]">
                  Both you and the worker will be notified. Response within 24 hours.
                </p>
              </div>
            )}

            {/* Step 3: Tracking (after submit) */}
            {step === "tracking" && (
              <div className="animate-scale-in text-center">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Dispute Filed Successfully</h2>
                <p className="text-sm text-[var(--color-muted)] mb-6">
                  Case ID: <span className="font-mono font-bold text-[var(--foreground)]">DIS-2024-0847</span>
                </p>

                {/* Timeline */}
                <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] text-left mb-6">
                  <h3 className="font-bold text-sm mb-4">Resolution Timeline</h3>
                  <div className="space-y-4">
                    {[
                      { time: "Now", label: "Dispute filed", status: "done", detail: "Your evidence has been submitted" },
                      { time: "~2 hrs", label: "Ops team reviews", status: "active", detail: "Our team examines evidence from both sides" },
                      { time: "~8 hrs", label: "Worker contacted", status: "pending", detail: "Worker will share their perspective" },
                      { time: "~24 hrs", label: "Decision communicated", status: "pending", detail: "Both parties notified via WhatsApp" },
                    ].map((t, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            t.status === "done" ? "bg-green-500" : t.status === "active" ? "bg-blue-500 animate-pulse" : "bg-gray-200"
                          }`} />
                          {i < 3 && <div className={`w-0.5 flex-1 ${t.status === "done" ? "bg-green-200" : "bg-gray-200"}`} />}
                        </div>
                        <div className="pb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[var(--color-muted)]">{t.time}</span>
                            <span className={`text-sm font-semibold ${t.status === "done" ? "text-green-700" : t.status === "active" ? "text-blue-700" : "text-[var(--color-muted)]"}`}>
                              {t.label}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)]">{t.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => { setStep("select"); setActiveTab("history"); }} className="btn-primary !w-full !justify-center">
                  View My Disputes
                </button>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold">Dispute History</h2>

            {demoCases.map((c) => {
              const colors = statusColors[c.status];
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                  <button
                    onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1E293B]/10 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-[#1E293B]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{c.id}</p>
                        <p className="text-xs text-[var(--color-muted)]">Booking: {c.booking} • Filed {c.filed}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colors.bg} ${colors.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedCase === c.id ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {expandedCase === c.id && (
                    <div className="px-4 pb-4 border-t border-[#E2E8F0] pt-3">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-[#F8FAFC] rounded-xl p-3">
                          <p className="text-[10px] text-[var(--color-muted)] mb-1">Type</p>
                          <p className="text-sm font-semibold">{disputeTypes.find(d => d.type === c.type)?.label}</p>
                        </div>
                        <div className="bg-[#F8FAFC] rounded-xl p-3">
                          <p className="text-[10px] text-[var(--color-muted)] mb-1">SLA Status</p>
                          <p className="text-sm font-semibold">{c.sla}</p>
                        </div>
                      </div>
                      {c.resolution && (
                        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                          <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolution
                          </p>
                          <p className="text-xs text-green-800">{c.resolution}</p>
                        </div>
                      )}
                      {c.status !== "resolved" && (
                        <div className="mt-3 flex gap-2">
                          <button className="btn-primary !py-2 !px-4 !text-xs">
                            <MessageCircle className="w-3.5 h-3.5" /> Add Evidence
                          </button>
                          <button className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold hover:bg-gray-50">
                            Cancel Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* No disputes state */}
            {demoCases.length === 0 && (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-lg">All Clear!</p>
                <p className="text-sm text-[var(--color-muted)]">No disputes yet. We hope it stays that way! 🙏</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
