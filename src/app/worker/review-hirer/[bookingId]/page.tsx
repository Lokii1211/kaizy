"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { getSupabase } from "@/lib/supabase";
import UserAvatar from "@/components/UserAvatar";
import LoadingShell from "@/components/LoadingShell";

// ============================================================
// WORKER REVIEW SCREEN (Rating the Hirer)
// Route: /worker/review-hirer/[bookingId]
// 3-Star Simplicity · Quick Customer Tags · Direct /dashboard/worker Routing
// ============================================================

const POSITIVE_CUSTOMER_TAGS = [
  "Welcoming",
  "Clear instructions",
  "Easy to find",
  "Paid promptly",
];

const NEGATIVE_CUSTOMER_TAGS = [
  "Difficult to find",
  "Unclear about problem",
  "Hostile",
  "Haggled price",
];

export default function WorkerReviewHirerPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [hirerName, setHirerName] = useState<string>("Customer");
  const [loading, setLoading] = useState(true);

  // 3-star rating: 3 = Great, 2 = Okay, 1 = Difficult
  const [rating, setRating] = useState<number>(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = useMemo(() => getSupabase(), []);

  useEffect(() => {
    if (!bookingId) return;

    const fetchCustomer = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*, jobs(*, users(*))")
          .eq("id", bookingId)
          .single();

        if (!error && data) {
          const userObj = data.jobs?.users || {};
          setHirerName(userObj.name || "Customer");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [bookingId, supabase]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/reviews/hirer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          tags: selectedTags,
          comment: comment.trim(),
        }),
      });

      router.replace("/dashboard/worker");
    } catch {
      router.replace("/dashboard/worker");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingShell />;

  const tagsToShow = rating >= 2 ? POSITIVE_CUSTOMER_TAGS : NEGATIVE_CUSTOMER_TAGS;

  return (
    <div
      className="min-h-screen pb-24 px-5 pt-8 select-none flex flex-col justify-between"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Customer Recap */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full mx-auto p-0.5 border-2 border-green-500 overflow-hidden shadow-lg">
            <UserAvatar name={hirerName} size={60} />
          </div>

          <div>
            <h1
              className="text-[22px] font-black"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
            >
              How was {hirerName.split(" ")[0]} as a customer?
            </h1>
            <p className="text-[12px] font-bold text-gray-400 mt-0.5">
              Help build trust for other captains in the community.
            </p>
          </div>
        </div>

        {/* 3-Star Rating */}
        <div
          className="p-5 rounded-[22px] border text-center shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <div className="flex justify-center items-center gap-4">
            {[1, 2, 3].map((star) => {
              const isSelected = star <= rating;
              const emoji = star === 3 ? "⭐ Great" : star === 2 ? "😐 Okay" : "⚠️ Difficult";

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    setSelectedTags([]);
                  }}
                  className="px-4 py-2.5 rounded-[16px] border text-[13px] font-black transition-all active:scale-95 flex items-center gap-1.5"
                  style={{
                    background: isSelected ? "#FF6B00" : "var(--bg-surface)",
                    borderColor: isSelected ? "#FF6B00" : "var(--border-2)",
                    color: isSelected ? "#FFFFFF" : "var(--text-1)",
                  }}
                >
                  <span>{emoji}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Customer Tags */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
            Customer feedback tags:
          </span>

          <div className="flex flex-wrap gap-2">
            {tagsToShow.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className="px-3 py-2 rounded-[12px] text-[11px] font-black border transition-all active:scale-95"
                  style={{
                    background: isSelected ? "#FF6B00" : "var(--bg-card)",
                    borderColor: isSelected ? "#FF6B00" : "var(--border-2)",
                    color: isSelected ? "#FFFFFF" : "var(--text-1)",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes textarea */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
            Private notes for safety (optional)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any safety or access details other captains should know?"
            rows={2}
            className="w-full p-3.5 rounded-[18px] text-[12px] font-medium border outline-none resize-none shadow-sm"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-2)",
              color: "var(--text-1)",
            }}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="max-w-md mx-auto w-full pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-[18px] text-[14px] font-black text-white active:scale-98 disabled:opacity-40 transition-all shadow-xl flex items-center justify-center gap-2"
          style={{ background: "var(--brand)" }}
        >
          {submitting ? "Submitting..." : "Complete & Return to Feed →"}
        </button>
      </div>
    </div>
  );
}
