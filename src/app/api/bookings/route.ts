import { NextRequest, NextResponse } from "next/server";

// Booking escrow state machine
// States: created → funded → job_started → job_completed → disputed → released
type EscrowStatus = "created" | "funded" | "job_started" | "job_completed" | "disputed" | "released" | "refunded";

interface Booking {
  id: string;
  jobId: string;
  workerId: string;
  hirerId: string;
  workerName: string;
  hirerName: string;
  skill: string;
  task: string;
  amount: number;
  platformFee: number;
  workerPayout: number;
  escrowStatus: EscrowStatus;
  paymentMethod: string;
  upiId: string;
  scheduledDate: string;
  completedAt: string | null;
  rating: number | null;
  review: string | null;
  createdAt: string;
  updatedAt: string;
}

const bookings: Booking[] = [
  {
    id: "BKG-2024-001",
    jobId: "JOB-2024-001",
    workerId: "KON-2024-08271",
    hirerId: "KON-BIZ-001",
    workerName: "Raju Kumar",
    hirerName: "Kumar Electronics",
    skill: "Electrician",
    task: "Shop Rewiring",
    amount: 1800,
    platformFee: 180,
    workerPayout: 1620,
    escrowStatus: "released",
    paymentMethod: "upi",
    upiId: "raju.kumar@upi",
    scheduledDate: "2024-03-14",
    completedAt: "2024-03-14T16:00:00Z",
    rating: 5,
    review: "Excellent work, very professional.",
    createdAt: "2024-03-14T08:00:00Z",
    updatedAt: "2024-03-14T16:30:00Z",
  },
  {
    id: "BKG-2024-002",
    jobId: "JOB-2024-002",
    workerId: "KON-2024-08273",
    hirerId: "KON-BIZ-002",
    workerName: "Suresh Babu",
    hirerName: "Apex Apartments",
    skill: "Plumber",
    task: "Pipe Replacement",
    amount: 2200,
    platformFee: 220,
    workerPayout: 1980,
    escrowStatus: "job_started",
    paymentMethod: "upi",
    upiId: "suresh.babu@upi",
    scheduledDate: "2024-03-14",
    completedAt: null,
    rating: null,
    review: null,
    createdAt: "2024-03-14T09:00:00Z",
    updatedAt: "2024-03-14T10:00:00Z",
  },
  {
    id: "BKG-2024-003",
    jobId: "JOB-2024-004",
    workerId: "KON-2024-08274",
    hirerId: "KON-BIZ-004",
    workerName: "Anil Verma",
    hirerName: "TechPark Solutions",
    skill: "Carpenter",
    task: "Shelf Installation",
    amount: 3500,
    platformFee: 350,
    workerPayout: 3150,
    escrowStatus: "funded",
    paymentMethod: "upi",
    upiId: "anil.verma@upi",
    scheduledDate: "2024-03-15",
    completedAt: null,
    rating: null,
    review: null,
    createdAt: "2024-03-13T14:00:00Z",
    updatedAt: "2024-03-13T14:30:00Z",
  },
];

// Valid state transitions
const validTransitions: Record<EscrowStatus, EscrowStatus[]> = {
  created: ["funded", "refunded"],
  funded: ["job_started", "refunded"],
  job_started: ["job_completed", "disputed"],
  job_completed: ["released", "disputed"],
  disputed: ["released", "refunded"],
  released: [],
  refunded: [],
};

// GET /api/bookings — List bookings
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get("workerId");
  const hirerId = searchParams.get("hirerId");
  const status = searchParams.get("status");

  let filtered = [...bookings];

  if (workerId) filtered = filtered.filter((b) => b.workerId === workerId);
  if (hirerId) filtered = filtered.filter((b) => b.hirerId === hirerId);
  if (status) filtered = filtered.filter((b) => b.escrowStatus === status);

  return NextResponse.json({
    success: true,
    data: filtered,
    total: filtered.length,
  });
}

// POST /api/bookings — Create new booking with escrow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, workerId, hirerId, amount, scheduledDate, upiId } = body;

    if (!jobId || !workerId || !hirerId || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: jobId, workerId, hirerId, amount" },
        { status: 400 }
      );
    }

    const platformFee = Math.round(amount * 0.10);
    const workerPayout = amount - platformFee;

    const newBooking: Booking = {
      id: `BKG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      jobId,
      workerId,
      hirerId,
      workerName: "Worker",
      hirerName: "Hirer",
      skill: "",
      task: "",
      amount,
      platformFee,
      workerPayout,
      escrowStatus: "created",
      paymentMethod: "upi",
      upiId: upiId || "",
      scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
      completedAt: null,
      rating: null,
      review: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: newBooking,
        message: "Booking created. Escrow initiated. Hirer to fund via UPI.",
        escrow: {
          status: "created",
          nextStep: "Fund escrow via UPI",
          amount,
          platformFee,
          workerPayout,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// PATCH /api/bookings — Update escrow status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, action, rating, review } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: bookingId, action" },
        { status: 400 }
      );
    }

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const newStatus = action as EscrowStatus;
    if (!validTransitions[booking.escrowStatus].includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid state transition: ${booking.escrowStatus} → ${newStatus}`,
          validTransitions: validTransitions[booking.escrowStatus],
        },
        { status: 400 }
      );
    }

    const updated = {
      ...booking,
      escrowStatus: newStatus,
      updatedAt: new Date().toISOString(),
      ...(newStatus === "job_completed" && { completedAt: new Date().toISOString() }),
      ...(rating && { rating }),
      ...(review && { review }),
    };

    const messages: Record<string, string> = {
      funded: "Escrow funded. Awaiting job start.",
      job_started: "Job started. Worker is on-site.",
      job_completed: "Job marked complete. Awaiting hirer confirmation.",
      released: `Payment of ₹${booking.workerPayout} released to worker via UPI.`,
      disputed: "Dispute raised. Human agent will review within 24 hours.",
      refunded: `Refund of ₹${booking.amount} initiated to hirer.`,
    };

    return NextResponse.json({
      success: true,
      data: updated,
      message: messages[newStatus] || "Status updated.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
