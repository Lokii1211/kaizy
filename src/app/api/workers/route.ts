import { NextRequest, NextResponse } from "next/server";

// Mock worker database
const workers = [
  {
    id: "KON-2024-08271",
    name: "Raju Kumar",
    phone: "+919876543210",
    city: "Coimbatore",
    state: "Tamil Nadu",
    skills: ["electrician"],
    specializations: ["House Wiring", "MCB Installation", "Solar Panel"],
    experience: "10+",
    rating: 4.8,
    jobsCompleted: 127,
    konnectScore: 780,
    verified: true,
    available: true,
    languages: ["Tamil", "Hindi"],
    rate: { min: 800, max: 1800 },
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "KON-2024-08272",
    name: "Priya Sharma",
    phone: "+919876543211",
    city: "Coimbatore",
    state: "Tamil Nadu",
    skills: ["ac_technician"],
    specializations: ["Split AC", "Window AC", "VRF Systems"],
    experience: "8",
    rating: 4.9,
    jobsCompleted: 89,
    konnectScore: 810,
    verified: true,
    available: true,
    languages: ["Tamil", "English"],
    rate: { min: 1000, max: 2500 },
    createdAt: "2024-02-01T10:00:00Z",
  },
  {
    id: "KON-2024-08273",
    name: "Suresh Babu",
    phone: "+919876543212",
    city: "Coimbatore",
    state: "Tamil Nadu",
    skills: ["plumber"],
    specializations: ["Pipe Fitting", "Drainage", "Bathroom"],
    experience: "15",
    rating: 4.6,
    jobsCompleted: 203,
    konnectScore: 720,
    verified: true,
    available: false,
    languages: ["Tamil"],
    rate: { min: 600, max: 1500 },
    createdAt: "2024-01-20T10:00:00Z",
  },
  {
    id: "KON-2024-08274",
    name: "Anil Verma",
    phone: "+919876543213",
    city: "Coimbatore",
    state: "Tamil Nadu",
    skills: ["carpenter"],
    specializations: ["Furniture", "Shelving", "Doors & Windows"],
    experience: "12",
    rating: 4.7,
    jobsCompleted: 156,
    konnectScore: 755,
    verified: true,
    available: true,
    languages: ["Hindi", "Tamil"],
    rate: { min: 700, max: 3000 },
    createdAt: "2024-02-10T10:00:00Z",
  },
  {
    id: "KON-2024-08275",
    name: "Lakshmi R",
    phone: "+919876543214",
    city: "Coimbatore",
    state: "Tamil Nadu",
    skills: ["painter"],
    specializations: ["Interior", "Exterior", "Texture"],
    experience: "6",
    rating: 4.5,
    jobsCompleted: 64,
    konnectScore: 690,
    verified: true,
    available: true,
    languages: ["Tamil", "Kannada"],
    rate: { min: 500, max: 2000 },
    createdAt: "2024-03-01T10:00:00Z",
  },
  {
    id: "KON-2024-08276",
    name: "Meena Devi",
    phone: "+919876543215",
    city: "Nagpur",
    state: "Maharashtra",
    skills: ["welder"],
    specializations: ["Arc Welding", "MIG", "Gate Fabrication"],
    experience: "7",
    rating: 4.8,
    jobsCompleted: 91,
    konnectScore: 760,
    verified: true,
    available: true,
    languages: ["Hindi", "Marathi"],
    rate: { min: 900, max: 2200 },
    createdAt: "2024-02-15T10:00:00Z",
  },
];

// GET /api/workers — List/search workers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skill = searchParams.get("skill");
  const city = searchParams.get("city");
  const available = searchParams.get("available");
  const minRating = searchParams.get("minRating");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  let filtered = [...workers];

  if (skill) {
    filtered = filtered.filter((w) => w.skills.includes(skill.toLowerCase()));
  }
  if (city) {
    filtered = filtered.filter((w) => w.city.toLowerCase() === city.toLowerCase());
  }
  if (available === "true") {
    filtered = filtered.filter((w) => w.available);
  }
  if (minRating) {
    filtered = filtered.filter((w) => w.rating >= parseFloat(minRating));
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.skills.some((s) => s.includes(q)) ||
        w.specializations.some((s) => s.toLowerCase().includes(q)) ||
        w.city.toLowerCase().includes(q)
    );
  }

  // Sort by rating descending
  filtered.sort((a, b) => b.rating - a.rating);

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    data: paged,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/workers — Register new worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, city, skills, experience, language } = body;

    if (!name || !phone || !city || !skills?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, phone, city, skills" },
        { status: 400 }
      );
    }

    const newWorker = {
      id: `KON-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
      name,
      phone,
      city,
      state: "",
      skills,
      specializations: [],
      experience: experience || "0-2",
      rating: 0,
      jobsCompleted: 0,
      konnectScore: 300,
      verified: false,
      available: true,
      languages: [language || "hi"],
      rate: { min: 0, max: 0 },
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data: newWorker, message: "Worker registered successfully. KonnectPassport created." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
