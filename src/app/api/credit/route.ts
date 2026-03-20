import { NextRequest, NextResponse } from "next/server";

// ========== KaizyScore / CONNECTSCORE CREDIT ENGINE (P4.3) ==========
// Alternative credit scoring for informal workers using work history instead of CIBIL

interface CreditFeature {
  name: string;
  category: "behavioral" | "financial" | "identity";
  value: number;
  max: number;
  weight: number;
  impact: "positive" | "negative" | "neutral";
  description: string;
}

interface ScoreBand {
  min: number;
  max: number;
  label: string;
  color: string;
  loan_eligible: boolean;
  max_loan_amount: number;
  interest_rate_band: string;
}

const SCORE_BANDS: ScoreBand[] = [
  { min: 800, max: 900, label: "Excellent", color: "#22c55e", loan_eligible: true, max_loan_amount: 50000, interest_rate_band: "12-14%" },
  { min: 700, max: 799, label: "Good", color: "#84cc16", loan_eligible: true, max_loan_amount: 30000, interest_rate_band: "14-18%" },
  { min: 600, max: 699, label: "Fair", color: "#f59e0b", loan_eligible: true, max_loan_amount: 15000, interest_rate_band: "18-24%" },
  { min: 500, max: 599, label: "Building", color: "#f97316", loan_eligible: false, max_loan_amount: 5000, interest_rate_band: "24-30%" },
  { min: 300, max: 499, label: "New", color: "#ef4444", loan_eligible: false, max_loan_amount: 0, interest_rate_band: "N/A" },
];

function calculateConnectScore(workerData: Record<string, number>): {
  score: number;
  band: ScoreBand;
  features: CreditFeature[];
  top_positive: string[];
  top_negative: string[];
  improvement_tips: string[];
} {
  const features: CreditFeature[] = [];

  // ===== BEHAVIORAL FEATURES (50% weight) =====

  // 1. Job Completion Rate (jobs completed / jobs accepted)
  const completionRate = workerData.jobs_completed / Math.max(workerData.jobs_accepted || 1, 1);
  features.push({
    name: "Job Completion Rate",
    category: "behavioral",
    value: Math.round(completionRate * 100),
    max: 100,
    weight: 0.15,
    impact: completionRate > 0.9 ? "positive" : completionRate > 0.7 ? "neutral" : "negative",
    description: `${Math.round(completionRate * 100)}% of accepted jobs completed`,
  });

  // 2. Rating Consistency (lower std dev = better)
  const ratingStdDev = workerData.rating_std_dev || 0;
  const ratingConsistency = Math.max(0, 100 - (ratingStdDev * 50));
  features.push({
    name: "Rating Consistency",
    category: "behavioral",
    value: Math.round(ratingConsistency),
    max: 100,
    weight: 0.1,
    impact: ratingConsistency > 70 ? "positive" : "neutral",
    description: `Rating variance: ${ratingStdDev.toFixed(2)}`,
  });

  // 3. Response Time (faster = more reliable)
  const avgResponseMins = workerData.avg_response_mins || 60;
  const responseScore = Math.max(0, 100 - (avgResponseMins / 2));
  features.push({
    name: "Response Speed",
    category: "behavioral",
    value: Math.round(responseScore),
    max: 100,
    weight: 0.08,
    impact: responseScore > 70 ? "positive" : "neutral",
    description: `Average response time: ${avgResponseMins} minutes`,
  });

  // 4. Platform Tenure
  const tenureMonths = workerData.tenure_months || 0;
  const tenureScore = Math.min(100, tenureMonths * 8);
  features.push({
    name: "Platform Tenure",
    category: "behavioral",
    value: Math.round(tenureScore),
    max: 100,
    weight: 0.07,
    impact: tenureScore > 50 ? "positive" : "neutral",
    description: `Active for ${tenureMonths} months`,
  });

  // 5. Dispute Rate (lower = better)
  const disputeRate = (workerData.disputes || 0) / Math.max(workerData.jobs_completed || 1, 1);
  const disputeScore = Math.max(0, 100 - (disputeRate * 500));
  features.push({
    name: "Dispute History",
    category: "behavioral",
    value: Math.round(disputeScore),
    max: 100,
    weight: 0.1,
    impact: disputeScore > 80 ? "positive" : disputeScore > 50 ? "neutral" : "negative",
    description: `${(disputeRate * 100).toFixed(1)}% dispute rate`,
  });

  // ===== FINANCIAL FEATURES (30% weight) =====

  // 6. Monthly Earnings Stability
  const earningsStdDev = workerData.earnings_std_dev || 5000;
  const avgEarnings = workerData.avg_monthly_earnings || 10000;
  const earningsCv = earningsStdDev / Math.max(avgEarnings, 1);
  const earningsStability = Math.max(0, 100 - (earningsCv * 100));
  features.push({
    name: "Income Stability",
    category: "financial",
    value: Math.round(earningsStability),
    max: 100,
    weight: 0.12,
    impact: earningsStability > 60 ? "positive" : "neutral",
    description: `Monthly earnings CV: ${(earningsCv * 100).toFixed(0)}%`,
  });

  // 7. Average Monthly Earning Power
  const earningPower = Math.min(100, (avgEarnings / 50000) * 100);
  features.push({
    name: "Earning Power",
    category: "financial",
    value: Math.round(earningPower),
    max: 100,
    weight: 0.1,
    impact: earningPower > 40 ? "positive" : "neutral",
    description: `Average: ₹${avgEarnings.toLocaleString("en-IN")}/month`,
  });

  // 8. UPI ID Stability (unchanged = trustworthy)
  const upiChanges = workerData.upi_changes || 0;
  const upiStability = upiChanges === 0 ? 100 : Math.max(0, 100 - (upiChanges * 30));
  features.push({
    name: "Payment Method Stability",
    category: "financial",
    value: Math.round(upiStability),
    max: 100,
    weight: 0.08,
    impact: upiStability > 70 ? "positive" : upiStability > 40 ? "neutral" : "negative",
    description: `UPI ID changed ${upiChanges} time(s)`,
  });

  // ===== IDENTITY FEATURES (20% weight) =====

  // 9. KYC Level
  const kycLevel = workerData.kyc_level || 1;
  const kycScore = (kycLevel / 5) * 100;
  features.push({
    name: "Verification Level",
    category: "identity",
    value: Math.round(kycScore),
    max: 100,
    weight: 0.12,
    impact: kycScore > 60 ? "positive" : "neutral",
    description: `Level ${kycLevel} of 5 verified`,
  });

  // 10. Certification Count
  const certs = workerData.certifications || 0;
  const certScore = Math.min(100, certs * 25);
  features.push({
    name: "Skill Certifications",
    category: "identity",
    value: Math.round(certScore),
    max: 100,
    weight: 0.08,
    impact: certScore > 50 ? "positive" : "neutral",
    description: `${certs} verified certificate(s)`,
  });

  // Calculate weighted score (300-900 range)
  const rawScore = features.reduce((sum, f) => sum + (f.value * f.weight), 0);
  const normalizedScore = Math.round(300 + (rawScore / 100) * 600);
  const finalScore = Math.max(300, Math.min(900, normalizedScore));

  // Find band
  const band = SCORE_BANDS.find(b => finalScore >= b.min && finalScore <= b.max) || SCORE_BANDS[SCORE_BANDS.length - 1];

  // Top positive/negative factors
  const sorted = [...features].sort((a, b) => (b.value * b.weight) - (a.value * a.weight));
  const topPositive = sorted.filter(f => f.impact === "positive").slice(0, 3).map(f => f.description);
  const topNegative = sorted.filter(f => f.impact === "negative").slice(0, 2).map(f => f.description);

  // Improvement tips (plain language)
  const tips: string[] = [];
  if (completionRate < 0.9) tips.push("Complete more accepted jobs to boost your score");
  if (avgResponseMins > 30) tips.push("Respond faster to job alerts — aim for under 15 minutes");
  if (kycLevel < 3) tips.push("Complete Aadhaar verification to unlock higher score");
  if (certs < 2) tips.push("Add skill certifications via DigiLocker to prove expertise");
  if (disputeRate > 0.1) tips.push("Reduce disputes by communicating clearly with hirers");
  if (earningsStability < 50) tips.push("Maintain steady monthly earnings for better stability score");

  return { score: finalScore, band, features, top_positive: topPositive, top_negative: topNegative, improvement_tips: tips.slice(0, 4) };
}

// POST — Calculate ConnectScore for a worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { worker_id, worker_data } = body;

    if (!worker_data) {
      return NextResponse.json({ error: "worker_data is required" }, { status: 400 });
    }

    const result = calculateConnectScore(worker_data);

    return NextResponse.json({
      success: true,
      worker_id: worker_id || "anonymous",
      score: result.score,
      band: result.band.label,
      band_color: result.band.color,
      loan_eligible: result.band.loan_eligible,
      max_loan_amount: result.band.max_loan_amount,
      interest_rate_band: result.band.interest_rate_band,
      features: result.features,
      factors: {
        helping: result.top_positive,
        hurting: result.top_negative,
      },
      improvement_tips: result.improvement_tips,
      last_updated: new Date().toISOString(),
      next_update: "Event-triggered (after next completed job)",
    });
  } catch {
    return NextResponse.json({ error: "Score calculation failed" }, { status: 500 });
  }
}

// GET — Calculate score for current logged-in user
export async function GET(request: NextRequest) {
  // Default worker data for new users
  const workerData = {
    jobs_accepted: 0,
    jobs_completed: 0,
    rating_std_dev: 0,
    avg_response_mins: 30,
    tenure_months: 1,
    disputes: 0,
    avg_monthly_earnings: 0,
    earnings_std_dev: 0,
    upi_changes: 0,
    kyc_level: 1,
    certifications: 0,
  };

  // Try to get real data from user
  let workerName = "User";
  try {
    const token = request.cookies.get('kaizy_token')?.value;
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      workerName = payload.phone || "User";
    }
  } catch {}

  const result = calculateConnectScore(workerData);

  return NextResponse.json({
    success: true,
    worker_name: workerName,
    score: result.score,
    band: result.band.label,
    band_color: result.band.color,
    loan_eligible: result.band.loan_eligible,
    max_loan_amount: `₹${result.band.max_loan_amount.toLocaleString("en-IN")}`,
    interest_rate_band: result.band.interest_rate_band,
    features: result.features,
    factors: {
      helping: result.top_positive,
      hurting: result.top_negative,
    },
    improvement_tips: result.improvement_tips,
    score_bands: SCORE_BANDS.map(b => ({
      range: `${b.min}-${b.max}`,
      label: b.label,
      loan_eligible: b.loan_eligible,
      max_loan: `₹${b.max_loan_amount.toLocaleString("en-IN")}`,
    })),
  });
}
