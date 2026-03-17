import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Kaizy — SMART MATCHING API
// Like Uber: distance + rating + price + KaizyScore + availability
// ============================================================

interface Worker {
  id: string; name: string; initials: string; trade: string; tradeIcon: string;
  rating: number; jobs: number; dist: number; price: number; color: string;
  verified: boolean; online: boolean; eta: number; lat: number; lng: number;
  experience: string; KaizyScore: number;
}

const WORKERS: Worker[] = [
  { id:"W001",name:"Raju Kumar",initials:"R",trade:"Electrician",tradeIcon:"⚡",rating:4.9,jobs:312,dist:1.2,price:500,color:"#FF6B00",verified:true,online:true,eta:8,lat:11.019,lng:76.952,experience:"10yr",KaizyScore:742 },
  { id:"W002",name:"Meena D.",initials:"M",trade:"Plumber",tradeIcon:"🔧",rating:4.7,jobs:189,dist:0.8,price:400,color:"#3B8BFF",verified:true,online:true,eta:5,lat:11.015,lng:76.958,experience:"8yr",KaizyScore:680 },
  { id:"W003",name:"Suresh M.",initials:"S",trade:"Mechanic",tradeIcon:"🚗",rating:4.8,jobs:256,dist:2.1,price:600,color:"#8B5CF6",verified:true,online:true,eta:12,lat:11.022,lng:76.960,experience:"15yr",KaizyScore:790 },
  { id:"W004",name:"Priya S.",initials:"P",trade:"AC Repair",tradeIcon:"❄️",rating:4.6,jobs:145,dist:1.5,price:700,color:"#06B6D4",verified:true,online:false,eta:10,lat:11.012,lng:76.950,experience:"6yr",KaizyScore:620 },
  { id:"W005",name:"Anand R.",initials:"A",trade:"Carpenter",tradeIcon:"🪚",rating:4.5,jobs:98,dist:3.2,price:450,color:"#10B981",verified:false,online:true,eta:18,lat:11.025,lng:76.965,experience:"12yr",KaizyScore:590 },
  { id:"W006",name:"Lakshmi R.",initials:"L",trade:"Painter",tradeIcon:"🎨",rating:4.4,jobs:67,dist:2.8,price:350,color:"#F59E0B",verified:true,online:true,eta:15,lat:11.020,lng:76.945,experience:"5yr",KaizyScore:540 },
  { id:"W007",name:"Gopal V.",initials:"G",trade:"Mason",tradeIcon:"⚒️",rating:4.6,jobs:203,dist:4.1,price:550,color:"#6366F1",verified:true,online:true,eta:22,lat:11.028,lng:76.970,experience:"20yr",KaizyScore:710 },
  { id:"W008",name:"Kavitha P.",initials:"K",trade:"Electrician",tradeIcon:"⚡",rating:4.7,jobs:134,dist:1.9,price:480,color:"#FF6B00",verified:true,online:true,eta:11,lat:11.018,lng:76.962,experience:"7yr",KaizyScore:660 },
  { id:"W009",name:"Venkat S.",initials:"V",trade:"Puncture",tradeIcon:"🛞",rating:4.3,jobs:412,dist:0.5,price:150,color:"#EC4899",verified:true,online:true,eta:3,lat:11.017,lng:76.956,experience:"8yr",KaizyScore:580 },
  { id:"W010",name:"Deepa K.",initials:"D",trade:"AC Repair",tradeIcon:"❄️",rating:4.8,jobs:178,dist:1.1,price:650,color:"#06B6D4",verified:true,online:true,eta:7,lat:11.014,lng:76.953,experience:"9yr",KaizyScore:720 },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trade, lat = 11.0168, lng = 76.9558, maxDistance = 5, onlineOnly = true, sortBy = "smart", limit = 5 } = body;

    let results = WORKERS
      .filter(w => !onlineOnly || w.online)
      .filter(w => !trade || trade === "All" || w.trade.toLowerCase() === trade.toLowerCase())
      .map(w => {
        const realDist = haversine(lat, lng, w.lat, w.lng);
        const eta = Math.round(realDist * 6 + 3); // ~6 min/km + 3 min buffer
        return { ...w, dist: Math.round(realDist * 100) / 100, eta };
      })
      .filter(w => w.dist <= maxDistance);

    // Smart scoring (Uber-style algorithm)
    if (sortBy === "smart") {
      results = results.map(w => ({
        ...w,
        matchScore: Math.round(
          (w.rating / 5) * 30 +           // 30% weight on rating
          (1 - w.dist / maxDistance) * 25 + // 25% weight on proximity
          (w.KaizyScore / 800) * 20 +       // 20% weight on KaizyScore
          (w.verified ? 15 : 0) +          // 15% bonus for verified
          (w.jobs / 500) * 10              // 10% weight on experience
        ),
      })).sort((a, b) => (b as Worker & { matchScore: number }).matchScore - (a as Worker & { matchScore: number }).matchScore);
    } else if (sortBy === "distance") {
      results.sort((a, b) => a.dist - b.dist);
    } else if (sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price") {
      results.sort((a, b) => a.price - b.price);
    }

    return NextResponse.json({
      success: true,
      data: {
        workers: results.slice(0, limit),
        total: results.length,
        searchRadius: maxDistance,
        center: { lat, lng },
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trade = searchParams.get("trade") || "All";
  const lat = parseFloat(searchParams.get("lat") || "11.0168");
  const lng = parseFloat(searchParams.get("lng") || "76.9558");

  const results = WORKERS
    .filter(w => w.online && (trade === "All" || w.trade.toLowerCase() === trade.toLowerCase()))
    .map(w => ({ ...w, dist: Math.round(haversine(lat, lng, w.lat, w.lng) * 100) / 100 }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);

  return NextResponse.json({ success: true, data: { workers: results, total: results.length } });
}
