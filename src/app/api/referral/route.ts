import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════
// REFERRAL SYSTEM — Production-grade with Supabase
// - Unique code per user (persistent)
// - Track referrals in database
// - Tiered rewards (Bronze→Platinum)
// - Milestone bonuses (5th, 10th, 25th, 50th referral)
// - Leaderboard
// ════════════════════════════════════════════════════════════

const TIER_REWARDS: Record<string, number> = {
  bronze: 100,
  silver: 150,
  gold: 200,
  platinum: 300,
};

const MILESTONE_BONUSES: Record<number, { bonus: number; badge: string }> = {
  5:  { bonus: 250,  badge: "🎯 First Five" },
  10: { bonus: 500,  badge: "🔥 On Fire" },
  25: { bonus: 1000, badge: "⭐ Star Referrer" },
  50: { bonus: 2500, badge: "💎 Legend" },
  100:{ bonus: 5000, badge: "👑 Champion" },
};

function getTier(count: number): string {
  if (count >= 51) return "platinum";
  if (count >= 16) return "gold";
  if (count >= 6) return "silver";
  return "bronze";
}

function generateCode(phone: string): string {
  const prefix = "KZ";
  const hash = phone.slice(-4);
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}${hash}${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── GENERATE or GET referral code ──
    if (action === "generate_code") {
      const { userId, name, phone } = body;
      if (!userId && !phone) {
        return NextResponse.json({ success: false, error: "userId or phone required" }, { status: 400 });
      }

      // Check if user already has a code in DB
      const identifier = userId || phone;
      const { data: existing } = await supabaseAdmin
        .from("referral_codes")
        .select("*")
        .eq("user_id", identifier)
        .single();

      if (existing) {
        // Return existing code
        const { data: refs } = await supabaseAdmin
          .from("referral_tracking")
          .select("*")
          .eq("referrer_code", existing.code)
          .order("created_at", { ascending: false });

        const completedCount = (refs || []).filter(r => r.status === "completed").length;
        const totalEarned = (refs || []).reduce((sum, r) => sum + (r.reward || 0), 0);

        return NextResponse.json({
          success: true,
          data: {
            code: existing.code,
            shareUrl: `https://kaizyy.vercel.app/join?ref=${existing.code}`,
            tier: getTier(completedCount),
            reward: TIER_REWARDS[getTier(completedCount)],
            totalEarned,
            completedCount,
            pendingCount: (refs || []).length - completedCount,
            referrals: refs || [],
          },
        });
      }

      // Generate new code
      const code = generateCode(phone || identifier);
      const { error: insertErr } = await supabaseAdmin
        .from("referral_codes")
        .insert({
          user_id: identifier,
          code,
          name: name || "User",
          phone: phone || "",
          tier: "bronze",
          created_at: new Date().toISOString(),
        });

      if (insertErr) {
        // Table might not exist, use fallback code
        return NextResponse.json({
          success: true,
          data: {
            code,
            shareUrl: `https://kaizyy.vercel.app/join?ref=${code}`,
            tier: "bronze",
            reward: TIER_REWARDS.bronze,
            totalEarned: 0,
            completedCount: 0,
            pendingCount: 0,
            referrals: [],
            note: "Code generated (local mode)",
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          code,
          shareUrl: `https://kaizyy.vercel.app/join?ref=${code}`,
          tier: "bronze",
          reward: TIER_REWARDS.bronze,
          totalEarned: 0,
          completedCount: 0,
          pendingCount: 0,
          referrals: [],
        },
      });
    }

    // ── TRACK a new referral ──
    if (action === "track") {
      const { referrerCode, referredName, referredPhone, referredSkill } = body;
      if (!referrerCode || !referredName || !referredPhone) {
        return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
      }

      // Verify referrer code exists
      const { data: referrer } = await supabaseAdmin
        .from("referral_codes")
        .select("*")
        .eq("code", referrerCode)
        .single();

      if (!referrer) {
        return NextResponse.json({ success: false, error: "Invalid referral code" }, { status: 400 });
      }

      // Check duplicate
      const { data: dup } = await supabaseAdmin
        .from("referral_tracking")
        .select("id")
        .eq("referrer_code", referrerCode)
        .eq("referred_phone", referredPhone)
        .single();

      if (dup) {
        return NextResponse.json({ success: false, error: "Already referred" }, { status: 409 });
      }

      // Insert tracking
      await supabaseAdmin.from("referral_tracking").insert({
        referrer_code: referrerCode,
        referrer_user_id: referrer.user_id,
        referred_name: referredName,
        referred_phone: referredPhone,
        referred_skill: referredSkill || "General",
        status: "pending",
        reward: 0,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Referral tracked. Reward after first job completion.",
      });
    }

    // ── COMPLETE a referral (when referred user finishes first job) ──
    if (action === "complete") {
      const { referrerCode, referredPhone } = body;
      
      const { data: tracking } = await supabaseAdmin
        .from("referral_tracking")
        .select("*")
        .eq("referrer_code", referrerCode)
        .eq("referred_phone", referredPhone)
        .eq("status", "pending")
        .single();

      if (!tracking) {
        return NextResponse.json({ success: false, error: "No pending referral" }, { status: 404 });
      }

      // Count completed referrals to determine tier
      const { data: allRefs } = await supabaseAdmin
        .from("referral_tracking")
        .select("status")
        .eq("referrer_code", referrerCode);

      const completedCount = (allRefs || []).filter(r => r.status === "completed").length + 1;
      const tier = getTier(completedCount);
      const reward = TIER_REWARDS[tier];
      
      // Check for milestone bonus
      const milestone = MILESTONE_BONUSES[completedCount];
      const totalReward = reward + (milestone?.bonus || 0);

      // Update tracking record
      await supabaseAdmin
        .from("referral_tracking")
        .update({ status: "completed", reward: totalReward })
        .eq("id", tracking.id);

      // Update referrer tier
      await supabaseAdmin
        .from("referral_codes")
        .update({ tier })
        .eq("code", referrerCode);

      return NextResponse.json({
        success: true,
        data: {
          reward,
          milestoneBonus: milestone?.bonus || 0,
          milestoneBadge: milestone?.badge || null,
          totalReward,
          tier,
          totalReferrals: completedCount,
          message: milestone
            ? `🎉 ₹${reward} + ₹${milestone.bonus} milestone bonus! (${milestone.badge})`
            : `₹${reward} credited for referral!`,
        },
      });
    }

    // ── GET stats ──
    if (action === "stats") {
      const { userId, phone } = body;
      const identifier = userId || phone;
      
      if (!identifier) {
        return NextResponse.json({ success: true, data: { code: null, tier: "bronze", referrals: [], totalEarned: 0 } });
      }

      const { data: codeData } = await supabaseAdmin
        .from("referral_codes")
        .select("*")
        .eq("user_id", identifier)
        .single();

      if (!codeData) {
        return NextResponse.json({ success: true, data: { code: null, tier: "bronze", referrals: [], totalEarned: 0 } });
      }

      const { data: refs } = await supabaseAdmin
        .from("referral_tracking")
        .select("*")
        .eq("referrer_code", codeData.code)
        .order("created_at", { ascending: false });

      const completedCount = (refs || []).filter(r => r.status === "completed").length;
      const totalEarned = (refs || []).reduce((sum, r) => sum + (r.reward || 0), 0);
      const nextTierTarget = completedCount < 6 ? 6 : completedCount < 16 ? 16 : completedCount < 51 ? 51 : null;

      // Check upcoming milestone
      const nextMilestone = Object.entries(MILESTONE_BONUSES).find(([count]) => Number(count) > completedCount);

      return NextResponse.json({
        success: true,
        data: {
          code: codeData.code,
          tier: getTier(completedCount),
          referrals: refs || [],
          totalEarned,
          completedCount,
          pendingCount: (refs || []).length - completedCount,
          nextTierTarget,
          nextMilestone: nextMilestone ? { count: Number(nextMilestone[0]), bonus: nextMilestone[1].bonus, badge: nextMilestone[1].badge } : null,
          incentives: Object.entries(MILESTONE_BONUSES).map(([count, data]) => ({
            count: Number(count), ...data, achieved: completedCount >= Number(count),
          })),
        },
      });
    }

    // ── LEADERBOARD ──
    if (action === "leaderboard") {
      const { data } = await supabaseAdmin
        .from("referral_codes")
        .select("code, name, tier")
        .order("tier", { ascending: false })
        .limit(10);

      // Get counts for each
      const leaderboard = await Promise.all((data || []).map(async (entry) => {
        const { data: refs } = await supabaseAdmin
          .from("referral_tracking")
          .select("reward, status")
          .eq("referrer_code", entry.code);
        const completed = (refs || []).filter(r => r.status === "completed").length;
        const earned = (refs || []).reduce((sum, r) => sum + (r.reward || 0), 0);
        return { ...entry, completedCount: completed, totalEarned: earned };
      }));

      leaderboard.sort((a, b) => b.totalEarned - a.totalEarned);

      return NextResponse.json({ success: true, data: leaderboard.slice(0, 10) });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[referral error]", err);
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

// GET: validate a referral code
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ success: false, error: "Code required" });
  }

  const { data } = await supabaseAdmin
    .from("referral_codes")
    .select("code, name, tier")
    .eq("code", code)
    .single();

  if (!data) {
    return NextResponse.json({ success: false, error: "Invalid code" });
  }

  return NextResponse.json({
    success: true,
    data: { code: data.code, referrerName: data.name, tier: data.tier, valid: true },
  });
}
