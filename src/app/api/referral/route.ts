import { NextRequest, NextResponse } from "next/server";

// Referral & Viral Growth API
// Handles referral code generation, tracking, and reward distribution

// In-memory store (Postgres in prod)
const referrals: Record<string, {
  code: string;
  userId: string;
  tier: string;
  referrals: { name: string; phone: string; skill: string; status: string; reward: number; date: string }[];
  totalEarned: number;
}> = {};

const TIER_REWARDS: Record<string, number> = {
  bronze: 100,
  silver: 150,
  gold: 200,
  platinum: 300,
};

function getTier(count: number): string {
  if (count >= 51) return "platinum";
  if (count >= 16) return "gold";
  if (count >= 6) return "silver";
  return "bronze";
}

function generateCode(name: string): string {
  const prefix = name.toUpperCase().replace(/\s+/g, "").slice(0, 4);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-KON-${suffix}`;
}

// POST /api/referral — Create referral code, track referral, get stats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Generate referral code
    if (action === "generate_code") {
      const { userId, name } = body;
      if (!userId || !name) {
        return NextResponse.json({ success: false, error: "userId and name required" }, { status: 400 });
      }

      const code = generateCode(name);
      referrals[userId] = {
        code,
        userId,
        tier: "bronze",
        referrals: [],
        totalEarned: 0,
      };

      return NextResponse.json({
        success: true,
        data: {
          code,
          shareUrl: `https://konnecton.in/r/${code}`,
          tier: "bronze",
          reward: TIER_REWARDS.bronze,
          whatsappMessage: `🧡 KonnectOn pe register karo — FREE hai!\n\nVerified jobs, same-day UPI payment, no middlemen.\n\nMera referral code: ${code}\n👉 https://konnecton.in/r/${code}`,
        },
      });
    }

    // Track a new referral
    if (action === "track") {
      const { referrerCode, referredName, referredPhone, referredSkill } = body;
      if (!referrerCode || !referredName || !referredPhone) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      // Find referrer by code
      const referrer = Object.values(referrals).find((r) => r.code === referrerCode);
      if (!referrer) {
        return NextResponse.json({ success: false, error: "Invalid referral code" }, { status: 400 });
      }

      // Check for duplicate
      if (referrer.referrals.some((r) => r.phone === referredPhone)) {
        return NextResponse.json({ success: false, error: "This phone already referred" }, { status: 409 });
      }

      referrer.referrals.push({
        name: referredName,
        phone: referredPhone,
        skill: referredSkill || "Unknown",
        status: "pending",
        reward: 0,
        date: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Referral tracked. Reward will be credited after first job completion.",
      });
    }

    // Complete a referral (triggered when referred user completes first job)
    if (action === "complete") {
      const { referrerCode, referredPhone } = body;
      const referrer = Object.values(referrals).find((r) => r.code === referrerCode);
      if (!referrer) {
        return NextResponse.json({ success: false, error: "Referrer not found" }, { status: 404 });
      }

      const ref = referrer.referrals.find((r) => r.phone === referredPhone && r.status === "pending");
      if (!ref) {
        return NextResponse.json({ success: false, error: "No pending referral found" }, { status: 404 });
      }

      const completedCount = referrer.referrals.filter((r) => r.status === "completed").length + 1;
      const tier = getTier(completedCount);
      const reward = TIER_REWARDS[tier];

      ref.status = "completed";
      ref.reward = reward;
      referrer.tier = tier;
      referrer.totalEarned += reward;

      return NextResponse.json({
        success: true,
        data: {
          reward,
          newTotal: referrer.totalEarned,
          tier,
          totalReferrals: completedCount,
          message: `₹${reward} credited for referral of ${ref.name}!`,
        },
      });
    }

    // Get referral stats
    if (action === "stats") {
      const { userId } = body;
      const data = referrals[userId];
      if (!data) {
        return NextResponse.json({
          success: true,
          data: { code: null, tier: "bronze", referrals: [], totalEarned: 0 },
        });
      }

      const completedCount = data.referrals.filter((r) => r.status === "completed").length;
      return NextResponse.json({
        success: true,
        data: {
          code: data.code,
          tier: data.tier,
          referrals: data.referrals,
          totalEarned: data.totalEarned,
          completedCount,
          pendingCount: data.referrals.length - completedCount,
          nextTier: getTier(completedCount + 1) !== data.tier ? getTier(completedCount + 1) : null,
          nextTierTarget: completedCount < 6 ? 6 : completedCount < 16 ? 16 : completedCount < 51 ? 51 : null,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
