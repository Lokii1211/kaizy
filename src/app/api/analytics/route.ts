import { NextRequest, NextResponse } from "next/server";

// GET /api/analytics — Platform analytics
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "monthly";

  const analytics = {
    overview: {
      totalWorkers: 7450,
      activeWorkers: 4200,
      totalHirers: 1950,
      activeHirers: 1100,
      totalBookings: 3570,
      completedBookings: 2890,
      totalGmv: 5230000,
      totalRevenue: 523000,
      avgRating: 4.6,
      konnectBotQueries: 12400,
      konnectBotResolutionRate: 87,
    },
    growth: {
      workerGrowthRate: 18,
      hirerGrowthRate: 14,
      bookingGrowthRate: 22,
      gmvGrowthRate: 28,
    },
    cityBreakdown: [
      { city: "Coimbatore", workers: 2450, hirers: 680, bookings: 1230, gmv: 1850000, growth: 12 },
      { city: "Nagpur", workers: 1820, hirers: 420, bookings: 890, gmv: 1210000, growth: 18 },
      { city: "Surat", workers: 1560, hirers: 380, bookings: 720, gmv: 1080000, growth: 22 },
      { city: "Lucknow", workers: 980, hirers: 290, bookings: 450, gmv: 670000, growth: 15 },
      { city: "Vizag", workers: 640, hirers: 180, bookings: 280, gmv: 420000, growth: 28 },
    ],
    skillDemand: [
      { skill: "Electrician", demand: 1240, supply: 980, gap: -260, avgRate: 1200 },
      { skill: "Plumber", demand: 890, supply: 720, gap: -170, avgRate: 1000 },
      { skill: "AC Technician", demand: 670, supply: 450, gap: -220, avgRate: 1800 },
      { skill: "Carpenter", demand: 780, supply: 620, gap: -160, avgRate: 1500 },
      { skill: "Painter", demand: 560, supply: 480, gap: -80, avgRate: 900 },
      { skill: "Welder", demand: 340, supply: 280, gap: -60, avgRate: 1400 },
    ],
    revenueBreakdown: {
      marketplaceCommission: 480000,
      konnectPremium: 120000,
      contractorSaas: 80000,
      nbfcReferral: 60000,
      insurance: 30000,
      other: 40000,
    },
    funnel: {
      registered: 7450,
      profileCompleted: 6200,
      firstJobApplied: 4100,
      firstJobCompleted: 3200,
      repeatWorkers: 1800,
    },
    kpi: {
      workerActivationD1: 72,
      workerActivationD7: 68,
      workerActivationD30: 52,
      jobPostToBookingRate: 42,
      sameDayPaymentRate: 94,
      referralRate: 23,
      workerNps: 62,
      hirerNps: 58,
    },
    weeklyTrend: [
      { week: "W1", bookings: 680, gmv: 980000, workers: 6200 },
      { week: "W2", bookings: 750, gmv: 1120000, workers: 6600 },
      { week: "W3", bookings: 820, gmv: 1280000, workers: 7000 },
      { week: "W4", bookings: 910, gmv: 1450000, workers: 7450 },
    ],
  };

  return NextResponse.json({
    success: true,
    period,
    data: analytics,
    generatedAt: new Date().toISOString(),
  });
}
