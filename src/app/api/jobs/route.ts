import { NextRequest, NextResponse } from "next/server";

// Mock jobs database
const jobs = [
  {
    id: "JOB-2024-001",
    title: "Shop Electrical Rewiring",
    description: "Complete rewiring of hardware shop including MCB panel upgrade and new wiring for display lights.",
    hirerId: "KON-BIZ-001",
    hirerName: "Kumar Electronics",
    skillRequired: "electrician",
    specializations: ["House Wiring", "MCB Installation"],
    city: "Coimbatore",
    locality: "RS Puram",
    amount: 1800,
    status: "open",
    urgency: "tomorrow",
    duration: "4 hours",
    postedAt: "2024-03-14T08:00:00Z",
  },
  {
    id: "JOB-2024-002",
    title: "Bathroom Pipe Replacement",
    description: "Replace old GI pipes with CPVC in 2 bathrooms. Include new tap fittings.",
    hirerId: "KON-BIZ-002",
    hirerName: "Apex Apartments",
    skillRequired: "plumber",
    specializations: ["Pipe Fitting", "Bathroom"],
    city: "Coimbatore",
    locality: "Gandhipuram",
    amount: 2200,
    status: "open",
    urgency: "this_week",
    duration: "6 hours",
    postedAt: "2024-03-14T09:30:00Z",
  },
  {
    id: "JOB-2024-003",
    title: "Residential AC Service",
    description: "Deep cleaning and gas refill for 3 split AC units in apartment.",
    hirerId: "KON-BIZ-003",
    hirerName: "Green Homes",
    skillRequired: "ac_technician",
    specializations: ["Split AC"],
    city: "Coimbatore",
    locality: "Saibaba Colony",
    amount: 3500,
    status: "open",
    urgency: "today",
    duration: "3 hours",
    postedAt: "2024-03-14T07:00:00Z",
  },
  {
    id: "JOB-2024-004",
    title: "Office Furniture Installation",
    description: "Assemble and install 8 modular workstation desks and 2 storage cabinets.",
    hirerId: "KON-BIZ-004",
    hirerName: "TechPark Solutions",
    skillRequired: "carpenter",
    specializations: ["Furniture"],
    city: "Coimbatore",
    locality: "Tidel Park",
    amount: 4500,
    status: "assigned",
    urgency: "this_week",
    duration: "8 hours",
    postedAt: "2024-03-13T14:00:00Z",
  },
  {
    id: "JOB-2024-005",
    title: "Factory Gate Fabrication",
    description: "Design and fabricate a 12ft wide sliding gate with MS steel for factory entrance.",
    hirerId: "KON-BIZ-005",
    hirerName: "Precision Industries",
    skillRequired: "welder",
    specializations: ["Gate Fabrication", "MIG"],
    city: "Nagpur",
    locality: "MIDC Hingna",
    amount: 8500,
    status: "open",
    urgency: "next_week",
    duration: "3 days",
    postedAt: "2024-03-14T06:00:00Z",
  },
];

// GET /api/jobs — List/search jobs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skill = searchParams.get("skill");
  const city = searchParams.get("city");
  const status = searchParams.get("status");
  const urgency = searchParams.get("urgency");
  const query = searchParams.get("q");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");

  let filtered = [...jobs];

  if (skill) filtered = filtered.filter((j) => j.skillRequired === skill.toLowerCase());
  if (city) filtered = filtered.filter((j) => j.city.toLowerCase() === city.toLowerCase());
  if (status) filtered = filtered.filter((j) => j.status === status);
  if (urgency) filtered = filtered.filter((j) => j.urgency === urgency);
  if (minAmount) filtered = filtered.filter((j) => j.amount >= parseInt(minAmount));
  if (maxAmount) filtered = filtered.filter((j) => j.amount <= parseInt(maxAmount));
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skillRequired.includes(q) ||
        j.city.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    total: filtered.length,
  });
}

// POST /api/jobs — Create new job posting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, skillRequired, city, locality, amount, urgency, duration } = body;

    if (!title || !skillRequired || !city || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, skillRequired, city, amount" },
        { status: 400 }
      );
    }

    const newJob = {
      id: `JOB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      title,
      description: description || "",
      hirerId: "KON-BIZ-DEMO",
      hirerName: "Demo Business",
      skillRequired,
      specializations: [],
      city,
      locality: locality || "",
      amount,
      status: "open",
      urgency: urgency || "this_week",
      duration: duration || "TBD",
      postedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data: newJob, message: "Job posted successfully. Workers will be notified via WhatsApp." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
