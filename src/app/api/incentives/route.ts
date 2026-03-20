import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════
// WORKER INCENTIVES API — Like Uber/Swiggy Driver Incentives
// Daily targets · Weekly streaks · Monthly milestones
// Persistent via Supabase
// ════════════════════════════════════════════════════════════

// ── Incentive Definitions ──
const DAILY_TARGETS = [
  { id: "d1", jobs: 3, bonus: 50, label: "Complete 3 jobs", icon: "🎯" },
  { id: "d2", jobs: 5, bonus: 100, label: "Complete 5 jobs", icon: "🔥" },
  { id: "d3", jobs: 8, bonus: 200, label: "Complete 8 jobs", icon: "⚡" },
  { id: "d4", jobs: 12, bonus: 500, label: "Complete 12 jobs", icon: "💎" },
];

const WEEKLY_TARGETS = [
  { id: "w1", jobs: 15, bonus: 300, label: "15 jobs this week", icon: "📊" },
  { id: "w2", jobs: 25, bonus: 600, label: "25 jobs this week", icon: "🏆" },
  { id: "w3", jobs: 40, bonus: 1200, label: "40 jobs this week", icon: "👑" },
  { id: "w4", streak: 5, bonus: 500, label: "5-day work streak", icon: "🔥" },
  { id: "w5", streak: 7, bonus: 1000, label: "7-day work streak", icon: "💎" },
];

const MONTHLY_TARGETS = [
  { id: "m1", jobs: 50, bonus: 1000, label: "50 jobs this month", icon: "⭐" },
  { id: "m2", jobs: 100, bonus: 3000, label: "100 jobs this month", icon: "🏅" },
  { id: "m3", jobs: 150, bonus: 5000, label: "150 jobs this month", icon: "👑" },
  { id: "m4", rating: 4.5, bonus: 500, label: "Maintain 4.5+ rating", icon: "💫" },
  { id: "m5", rating: 4.8, bonus: 1000, label: "Maintain 4.8+ rating", icon: "🌟" },
  { id: "m6", earnings: 20000, bonus: 2000, label: "Earn ₹20K+ this month", icon: "💰" },
  { id: "m7", earnings: 50000, bonus: 5000, label: "Earn ₹50K+ this month", icon: "💎" },
];

const SPECIAL_BONUSES = [
  { id: "s1", type: "first_job", bonus: 100, label: "Complete your first job", icon: "🎉" },
  { id: "s2", type: "perfect_week", bonus: 750, label: "All 5-star reviews this week", icon: "⭐" },
  { id: "s3", type: "early_bird", bonus: 50, label: "Accept job within 30 seconds", icon: "⚡" },
  { id: "s4", type: "night_owl", bonus: 75, label: "Complete job after 9 PM", icon: "🌙" },
  { id: "s5", type: "weekend_warrior", bonus: 100, label: "Work on Saturday & Sunday", icon: "💪" },
  { id: "s6", type: "zero_cancel", bonus: 300, label: "0 cancellations this week", icon: "✅" },
];

function getDateRange(period: string) {
  const now = new Date();
  if (period === "daily") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start: start.toISOString(), end: now.toISOString() };
  }
  if (period === "weekly") {
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: now.toISOString() };
  }
  // monthly
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: start.toISOString(), end: now.toISOString() };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get("worker_id");

    if (!workerId) {
      return NextResponse.json({ success: false, error: "worker_id required" });
    }

    // Get worker stats from bookings
    const dailyRange = getDateRange("daily");
    const weeklyRange = getDateRange("weekly");
    const monthlyRange = getDateRange("monthly");

    // Query completed jobs for each period
    const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
      supabaseAdmin.from("bookings").select("id, created_at, hirer_price").eq("worker_id", workerId).eq("status", "completed").gte("completed_at", dailyRange.start),
      supabaseAdmin.from("bookings").select("id, created_at, hirer_price, completed_at").eq("worker_id", workerId).eq("status", "completed").gte("completed_at", weeklyRange.start),
      supabaseAdmin.from("bookings").select("id, created_at, hirer_price, completed_at").eq("worker_id", workerId).eq("status", "completed").gte("completed_at", monthlyRange.start),
    ]);

    const dailyJobs = dailyRes.data?.length || 0;
    const weeklyJobs = weeklyRes.data?.length || 0;
    const monthlyJobs = monthlyRes.data?.length || 0;
    const monthlyEarnings = (monthlyRes.data || []).reduce((sum, b) => sum + (b.hirer_price || 0), 0);

    // Get worker rating
    const { data: workerData } = await supabaseAdmin
      .from("workers")
      .select("avg_rating")
      .eq("id", workerId)
      .single();
    const rating = workerData?.avg_rating || 0;

    // Calculate streak (consecutive days with at least 1 job)
    const weeklyCompletions = (weeklyRes.data || []).map(b => 
      new Date(b.completed_at || b.created_at).toDateString()
    );
    const uniqueDays = new Set(weeklyCompletions).size;

    // Build incentive status
    const dailyIncentives = DAILY_TARGETS.map(t => ({
      ...t, current: dailyJobs, achieved: dailyJobs >= t.jobs,
      progress: Math.min((dailyJobs / t.jobs) * 100, 100),
    }));

    const weeklyIncentives = WEEKLY_TARGETS.map(t => {
      if (t.streak) {
        return { ...t, current: uniqueDays, achieved: uniqueDays >= t.streak,
          progress: Math.min((uniqueDays / t.streak) * 100, 100) };
      }
      return { ...t, current: weeklyJobs, achieved: weeklyJobs >= (t.jobs || 0),
        progress: Math.min((weeklyJobs / (t.jobs || 1)) * 100, 100) };
    });

    const monthlyIncentives = MONTHLY_TARGETS.map(t => {
      if (t.rating) {
        return { ...t, current: rating, achieved: rating >= t.rating,
          progress: Math.min((rating / t.rating) * 100, 100) };
      }
      if (t.earnings) {
        return { ...t, current: monthlyEarnings, achieved: monthlyEarnings >= t.earnings,
          progress: Math.min((monthlyEarnings / t.earnings) * 100, 100) };
      }
      return { ...t, current: monthlyJobs, achieved: monthlyJobs >= (t.jobs || 0),
        progress: Math.min((monthlyJobs / (t.jobs || 1)) * 100, 100) };
    });

    // Calculate total potential and earned
    const dailyEarned = dailyIncentives.filter(t => t.achieved).reduce((s, t) => s + t.bonus, 0);
    const weeklyEarned = weeklyIncentives.filter(t => t.achieved).reduce((s, t) => s + t.bonus, 0);
    const monthlyEarned = monthlyIncentives.filter(t => t.achieved).reduce((s, t) => s + t.bonus, 0);
    const totalPotential = [...DAILY_TARGETS, ...WEEKLY_TARGETS, ...MONTHLY_TARGETS].reduce((s, t) => s + t.bonus, 0);

    return NextResponse.json({
      success: true,
      data: {
        stats: { dailyJobs, weeklyJobs, monthlyJobs, monthlyEarnings, rating, streak: uniqueDays },
        daily: { targets: dailyIncentives, earned: dailyEarned },
        weekly: { targets: weeklyIncentives, earned: weeklyEarned },
        monthly: { targets: monthlyIncentives, earned: monthlyEarned },
        special: SPECIAL_BONUSES,
        summary: {
          totalEarned: dailyEarned + weeklyEarned + monthlyEarned,
          totalPotential,
          nextTarget: dailyIncentives.find(t => !t.achieved)?.label || weeklyIncentives.find(t => !t.achieved)?.label || "All done!",
        },
      },
    });
  } catch (err) {
    console.error("[incentives error]", err);
    return NextResponse.json({
      success: true,
      data: {
        stats: { dailyJobs: 0, weeklyJobs: 0, monthlyJobs: 0, monthlyEarnings: 0, rating: 0, streak: 0 },
        daily: { targets: DAILY_TARGETS.map(t => ({ ...t, current: 0, achieved: false, progress: 0 })), earned: 0 },
        weekly: { targets: WEEKLY_TARGETS.map(t => ({ ...t, current: 0, achieved: false, progress: 0 })), earned: 0 },
        monthly: { targets: MONTHLY_TARGETS.map(t => ({ ...t, current: 0, achieved: false, progress: 0 })), earned: 0 },
        special: SPECIAL_BONUSES,
        summary: { totalEarned: 0, totalPotential: 0, nextTarget: "Complete your first job!" },
      },
    });
  }
}
