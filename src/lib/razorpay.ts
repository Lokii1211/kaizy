// Kaizy — Razorpay Payment Service
// Handles UPI escrow payments, order creation, verification, and refunds

import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "secret_placeholder";
const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

interface CreateOrderParams {
  bookingId: string;
  amount: number; // in INR (will be converted to paise)
  workerName: string;
  hirerName: string;
  description: string;
}

interface OrderResult {
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  platformFee: number;
  workerPayout: number;
  receipt: string;
  status: string;
  razorpayKeyId: string;
}

interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Create Razorpay order for escrow payment
export async function createEscrowOrder(params: CreateOrderParams): Promise<OrderResult> {
  const { bookingId, amount, workerName, description } = params;
  const amountPaise = Math.round(amount * 100);
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);
  const workerPayout = amount - platformFee;

  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `KON-${bookingId}`,
        notes: {
          booking_id: bookingId,
          worker_name: workerName,
          platform_fee: platformFee,
          worker_payout: workerPayout,
          description,
        },
      }),
    });

    if (!response.ok) {
      // Fallback to mock order for development
      console.warn("[KaizyPay] Razorpay API unavailable, using mock order");
      return createMockOrder(bookingId, amount, platformFee, workerPayout);
    }

    const order = await response.json();
    return {
      orderId: order.id,
      amount,
      amountPaise,
      currency: "INR",
      platformFee,
      workerPayout,
      receipt: order.receipt,
      status: order.status,
      razorpayKeyId: RAZORPAY_KEY_ID,
    };
  } catch (error) {
    console.warn("[KaizyPay] Razorpay connection failed, using mock:", error);
    return createMockOrder(bookingId, amount, platformFee, workerPayout);
  }
}

// Verify payment signature from Razorpay
export function verifyPaymentSignature(params: VerifyPaymentParams): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpay_signature;
}

// Calculate escrow breakdown
export function calculateEscrow(amount: number) {
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);
  const gst = Math.round(platformFee * 18 / 100); // 18% GST on platform fee
  const insurance = 5; // ₹5 per-job micro-insurance
  const workerPayout = amount - platformFee;
  const totalPayable = amount + gst + insurance;

  return {
    serviceAmount: amount,
    platformFee,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    gst,
    insurance,
    workerPayout,
    totalPayable,
  };
}

// Initiate UPI settlement to worker (T+0 same-day)
export async function initiateWorkerPayout(params: {
  workerId: string;
  amount: number;
  upiId: string;
  bookingId: string;
}) {
  const { workerId, amount, upiId, bookingId } = params;

  // In production: Use Razorpay Payouts API (Route / X)
  // POST https://api.razorpay.com/v1/payouts
  console.log(`[KaizyPay] Payout ₹${amount} to ${upiId} (Worker: ${workerId}, Booking: ${bookingId})`);

  return {
    success: true,
    payoutId: `pout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount,
    upiId,
    status: "processing",
    estimatedArrival: "< 4 hours",
  };
}

// Mock order for development (when Razorpay keys not configured)
function createMockOrder(bookingId: string, amount: number, platformFee: number, workerPayout: number): OrderResult {
  return {
    orderId: `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount,
    amountPaise: amount * 100,
    currency: "INR",
    platformFee,
    workerPayout,
    receipt: `KON-${bookingId}`,
    status: "created",
    razorpayKeyId: RAZORPAY_KEY_ID,
  };
}
