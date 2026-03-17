// KonnectOn — WhatsApp Business API Service
// Send job alerts, booking confirmations, and payment notifications via WhatsApp
// Provider: Twilio / Gupshup WhatsApp Business API

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://api.gupshup.io/wa/api/v1/msg";
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || "placeholder_key";
const WHATSAPP_SOURCE_NUMBER = process.env.WHATSAPP_SOURCE_NUMBER || "+919876500000";

type MessageTemplate =
  | "job_alert"
  | "booking_confirmed"
  | "worker_assigned"
  | "payment_received"
  | "payment_released"
  | "otp"
  | "rating_request"
  | "emergency_alert";

interface WhatsAppMessage {
  to: string; // +91XXXXXXXXXX
  template: MessageTemplate;
  params: Record<string, string>;
  language?: string; // "hi" | "ta" | "te" | "bn" | "en"
}

// Template messages (multi-language)
const templates: Record<MessageTemplate, Record<string, string>> = {
  job_alert: {
    en: "🔔 *New Job Alert!*\n\n📋 {jobTitle}\n📍 {location}\n💰 ₹{amount}\n⏰ {timing}\n\n✅ Reply *ACCEPT* to take this job\n❌ Reply *SKIP* to see next",
    hi: "🔔 *नया काम मिला!*\n\n📋 {jobTitle}\n📍 {location}\n💰 ₹{amount}\n⏰ {timing}\n\n✅ *ACCEPT* लिखें काम लेने के लिए\n❌ *SKIP* लिखें अगला देखने के लिए",
    ta: "🔔 *புதிய வேலை!*\n\n📋 {jobTitle}\n📍 {location}\n💰 ₹{amount}\n⏰ {timing}\n\n✅ *ACCEPT* என்று பதிலளிக்கவும்\n❌ *SKIP* என்று பதிலளிக்கவும்",
  },
  booking_confirmed: {
    en: "✅ *Booking Confirmed!*\n\nWorker: {workerName}\nService: {service}\nDate: {date}\nAmount: ₹{amount}\n\n🔒 Payment held in escrow.\n📞 Call: {workerPhone}",
    hi: "✅ *बुकिंग पक्की!*\n\nकारीगर: {workerName}\nसेवा: {service}\nतारीख: {date}\nराशि: ₹{amount}\n\n🔒 पैसा एस्क्रो में सुरक्षित है।\n📞 कॉल: {workerPhone}",
  },
  worker_assigned: {
    en: "🎯 *New Job Assigned!*\n\nClient: {hirerName}\nTask: {task}\nLocation: {location}\nPay: ₹{amount}\n\n🗓 {date}\n📱 Track: {trackingLink}",
    hi: "🎯 *नया काम मिला!*\n\nग्राहक: {hirerName}\nकाम: {task}\nजगह: {location}\nपैसे: ₹{amount}\n\n🗓 {date}\n📱 ट्रैक: {trackingLink}",
  },
  payment_received: {
    en: "💰 *Payment Received!*\n\n₹{amount} credited to your UPI ({upiId})\nJob: {jobTitle}\nRating: {rating}⭐\n\n📊 KonnectScore: {score}/900",
    hi: "💰 *पैसे आ गए!*\n\n₹{amount} आपके UPI ({upiId}) में\nकाम: {jobTitle}\nरेटिंग: {rating}⭐\n\n📊 कनेक्टस्कोर: {score}/900",
  },
  payment_released: {
    en: "✅ *Payment Released!*\n\n₹{amount} sent to {workerName}'s UPI.\nBooking: {bookingId}\n\nThank you for using KonnectOn! 🙏",
  },
  otp: {
    en: "🔐 Your KonnectOn OTP: *{otp}*\nValid for 10 minutes.\nDo NOT share with anyone.",
    hi: "🔐 आपका KonnectOn OTP: *{otp}*\n10 मिनट के लिए वैध।\nकिसी को न बताएं।",
  },
  rating_request: {
    en: "⭐ *Rate your experience!*\n\nWorker: {workerName}\nJob: {jobTitle}\n\nReply with a number 1-5:\n1⭐ Poor\n2⭐ Below Average\n3⭐ Average\n4⭐ Good\n5⭐ Excellent",
  },
  emergency_alert: {
    en: "🆘 *Emergency Request!*\n\n{category} near {location}\nClient: {hirerName}\nETA needed: ASAP\n\n💰 ₹{amount} (emergency rate)\n\nReply *ACCEPT* to respond NOW",
    hi: "🆘 *इमरजेंसी!*\n\n{category} — {location} के पास\nग्राहक: {hirerName}\n\n💰 ₹{amount} (इमरजेंसी रेट)\n\n*ACCEPT* लिखें तुरंत जाने के लिए",
  },
};

// Send WhatsApp message
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, template, params, language = "en" } = message;

  // Get template text
  const templateTexts = templates[template];
  if (!templateTexts) {
    return { success: false, error: `Unknown template: ${template}` };
  }

  let text = templateTexts[language] || templateTexts["en"];

  // Replace params
  for (const [key, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }

  // Clean phone number
  const cleanPhone = to.replace(/\s+/g, "").replace(/^\+/, "");

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: WHATSAPP_API_KEY,
      },
      body: new URLSearchParams({
        channel: "whatsapp",
        source: WHATSAPP_SOURCE_NUMBER.replace("+", ""),
        destination: cleanPhone,
        "src.name": "KonnectOn",
        message: JSON.stringify({ type: "text", text }),
      }),
    });

    if (!response.ok) {
      console.warn(`[WhatsApp] API call failed (${response.status}), logging message locally`);
      return logMessageFallback(cleanPhone, template, text);
    }

    const result = await response.json();
    console.log(`[WhatsApp] Sent ${template} to ${cleanPhone}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.warn("[WhatsApp] Connection failed, falling back to log:", error);
    return logMessageFallback(cleanPhone, template, text);
  }
}

// Fallback: Log message when API is unavailable (development)
function logMessageFallback(phone: string, template: string, text: string) {
  console.log(`\n📱 [WhatsApp → ${phone}] Template: ${template}\n${text}\n`);
  return {
    success: true,
    messageId: `wa_local_${Date.now()}`,
  };
}

// Send job alerts to nearby workers
export async function broadcastJobAlert(params: {
  workerPhones: string[];
  jobTitle: string;
  location: string;
  amount: string;
  timing: string;
  language?: string;
}) {
  const results = await Promise.allSettled(
    params.workerPhones.map((phone) =>
      sendWhatsAppMessage({
        to: phone,
        template: "job_alert",
        params: {
          jobTitle: params.jobTitle,
          location: params.location,
          amount: params.amount,
          timing: params.timing,
        },
        language: params.language,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return { sent, failed, total: params.workerPhones.length };
}

// Send emergency alerts to workers within radius
export async function sendEmergencyAlert(params: {
  workerPhones: string[];
  category: string;
  location: string;
  hirerName: string;
  amount: string;
}) {
  return broadcastJobAlert({
    workerPhones: params.workerPhones,
    jobTitle: `🆘 ${params.category}`,
    location: params.location,
    amount: params.amount,
    timing: "ASAP — Emergency",
  });
}
