import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════
// POST /api/konnectbot — AI Chat
// Claude API primary + Smart fallback
// ═══════════════════════════════════════

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const SYSTEM_PROMPT = `You are KaizyBot, the AI assistant for Kaizy — India's workforce platform connecting skilled workers (electricians, plumbers, mechanics, AC repair, carpenters, painters) with hirers.

You help users with:
- Finding the right worker for their problem
- Understanding pricing (base rates: Electrician ₹400/hr, Plumber ₹350/hr, Mechanic ₹500/hr, AC Repair ₹600/hr, Carpenter ₹400/hr, Painter ₹300/hr)
- Explaining how Kaizy works (Uber model: Book → Match → Track → Pay → Review)
- Emergency SOS guidance (15km radius search, 1.8x emergency pricing)
- Payment info (Cash on Hand default, UPI supported, online coming soon)
- Worker registration help
- KaizyScore explanation (credit score for workers: 300-900 based on ratings, jobs, reliability)
- Troubleshooting common issues

Rules:
- Keep responses SHORT (2-3 sentences max for simple questions)
- Use emojis sparingly
- Be helpful and friendly
- If asked about pricing, give specific numbers
- Always suggest booking via the app for actual service
- Respond in the same language the user writes in (Hindi, Tamil, English)
- For emergencies, always suggest using KaizySOS feature`;

// ═══ Smart fallback when Claude API is unavailable ═══
function getSmartFallback(message: string): string {
  const msg = message.toLowerCase();

  // Greetings
  if (msg.match(/^(hi|hello|hey|namaste|vanakkam|hii+)/)) {
    return "Hey! 👋 I'm KaizyBot. I can help you find workers, understand pricing, or guide you through booking. What do you need help with?";
  }

  // What is Kaizy
  if (msg.includes('what is kaizy') || msg.includes('about kaizy') || msg.includes('kaizy kya')) {
    return "Kaizy is India's workforce platform! 🇮🇳 We connect you with verified electricians, plumbers, mechanics, AC repair technicians, carpenters & painters in minutes. Think of it like Uber, but for skilled workers. Book → Track live → Pay safely!";
  }

  // Trades available
  if (msg.includes('trade') || msg.includes('service') || msg.includes('what can') || msg.includes('available')) {
    return "We have 8 trades on Kaizy:\n⚡ Electrician (₹400/hr)\n🔧 Plumber (₹350/hr)\n🚗 Mechanic (₹500/hr)\n❄️ AC Repair (₹600/hr)\n🪚 Carpenter (₹400/hr)\n🎨 Painter (₹300/hr)\n⚒️ Mason (₹450/hr)\n🛞 Puncture Repair (₹150)\n\nTap any category on the home screen to find workers near you!";
  }

  // Pricing
  if (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('charge') || msg.includes('kitna') || msg.includes('paisa')) {
    return "Kaizy pricing is transparent! 💰\n\n• Electrician: ₹400/hr\n• Plumber: ₹350/hr\n• Mechanic: ₹500/hr\n• AC Repair: ₹600/hr\n• Carpenter: ₹400/hr\n• Painter: ₹300/hr\n\nPlus: ₹10/km travel fee. No hidden charges! You see the full price before booking.";
  }

  // Emergency / SOS
  if (msg.includes('emergency') || msg.includes('sos') || msg.includes('urgent') || msg.includes('help now')) {
    return "🆘 For emergencies, use KaizySOS on the home screen! It alerts the 10 nearest workers within 15km. Average response time: 8 minutes. Emergency pricing is 1.8x regular rates. Your safety is our priority!";
  }

  // How to book
  if (msg.includes('how to book') || msg.includes('booking') || msg.includes('hire') || msg.includes('book kaise')) {
    return "Booking is super easy! 📱\n\n1️⃣ Open Kaizy → Pick a service (Electrician, Plumber etc.)\n2️⃣ Describe your problem → See price upfront\n3️⃣ Select a worker → Confirm booking\n4️⃣ Track worker live on map\n5️⃣ Job done → Pay via Cash or UPI\n\nTakes under 90 seconds! Try it now on the home screen.";
  }

  // Payment
  if (msg.includes('payment') || msg.includes('pay') || msg.includes('upi') || msg.includes('cash') || msg.includes('money')) {
    return "Kaizy supports two payment methods:\n\n💵 Cash on Hand — Pay the worker directly after the job\n📱 UPI — Pay via Google Pay, PhonePe, Paytm etc.\n\nYour money is safe! We show the full price before booking. No hidden fees.";
  }

  // KaizyScore
  if (msg.includes('score') || msg.includes('kaizyscore') || msg.includes('rating')) {
    return "📊 KaizyScore is a credit score for workers (300-900). It's based on:\n• Job completion rate\n• Customer ratings\n• Punctuality\n• Verification level\n\nHigher score = more jobs + loan eligibility from partner banks. It's like a CIBIL score for skills!";
  }

  // Worker registration
  if (msg.includes('register') || msg.includes('join') || msg.includes('worker') || msg.includes('sign up') || msg.includes('kaam')) {
    return "Want to join as a worker? 💼\n\n1️⃣ Open Kaizy → Select 'I am a Worker'\n2️⃣ Enter your phone number → Verify OTP\n3️⃣ Upload selfie + Government ID\n4️⃣ Select your trade (electrician, plumber etc.)\n5️⃣ Go online and start receiving jobs!\n\nCommission is just ₹5 per job. Same-day UPI payments!";
  }

  // Safety / Trust
  if (msg.includes('safe') || msg.includes('trust') || msg.includes('verify') || msg.includes('verified')) {
    return "Your safety is our #1 priority! 🛡️\n\n✓ Every worker's Government ID is verified\n✓ Face match with AI technology\n✓ Live GPS tracking during the job\n✓ All reviews are from real customers\n✓ Payment held safely until job is complete\n\nYou can book with confidence!";
  }

  // Commission
  if (msg.includes('commission') || msg.includes('fee') || msg.includes('cut')) {
    return "Kaizy charges a flat ₹5 commission per completed job — that's it! 🎯 No 20-50% cuts like other platforms. Workers keep almost everything they earn, and payments hit their UPI within minutes.";
  }

  // Support / Help
  if (msg.includes('support') || msg.includes('help') || msg.includes('contact') || msg.includes('problem')) {
    return "Need help? We're here! 🤝\n\n📧 Email: support@kaizy.com\n💬 WhatsApp: Chat with us directly\n📞 Call: Available 9 AM - 11 PM\n\nYou can also visit the Help page in the app for FAQs and quick solutions!";
  }

  // Tamil
  if (msg.match(/[\u0B80-\u0BFF]/) || msg.includes('tamil')) {
    return "வணக்கம்! 🙏 நான் KaizyBot. உங்களுக்கு தொழிலாளர்களை கண்டறிய, விலையை புரிந்துகொள்ள, அல்லது முன்பதிவு செய்ய உதவ முடியும். என்ன உதவி வேண்டும்?";
  }

  // Hindi
  if (msg.match(/[\u0900-\u097F]/) || msg.includes('hindi')) {
    return "नमस्ते! 🙏 मैं KaizyBot हूँ। मैं आपकी मदद कर सकता हूँ - वर्कर ढूंढने में, प्राइसिंग समझने में, या बुकिंग करने में। बताइए क्या चाहिए?";
  }

  // Fallback for unknown
  return "I can help you with:\n\n🔧 **Finding workers** — Electricians, Plumbers, Mechanics & more\n💰 **Pricing info** — Transparent rates for all services\n📱 **How to book** — Step-by-step guide\n🆘 **Emergency SOS** — Urgent help in minutes\n💳 **Payments** — Cash & UPI options\n📊 **KaizyScore** — Worker credit system\n\nJust ask me anything about Kaizy!";
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    // Build conversation messages for Claude
    const messages: Array<{ role: string; content: string }> = [];
    if (history?.length) {
      for (const h of history.slice(-10)) {
        messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text });
      }
    }
    messages.push({ role: 'user', content: message });

    // Try Claude API first (if key exists and has credits)
    if (CLAUDE_API_KEY) {
      const claudeModels = ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'];

      for (const model of claudeModels) {
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': CLAUDE_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model,
              max_tokens: 300,
              system: SYSTEM_PROMPT,
              messages,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const reply = data.content?.[0]?.text;
            if (reply) {
              return NextResponse.json({ success: true, data: { reply, source: 'claude' } });
            }
          } else {
            const errorText = await response.text();
            console.error(`[claude ${model}]`, response.status, errorText);
          }
        } catch (e) {
          console.error(`[claude ${model} error]`, e);
        }
      }
    }

    // Fallback: Smart pattern-matched responses
    const fallbackReply = getSmartFallback(message);
    return NextResponse.json({ success: true, data: { reply: fallbackReply, source: 'fallback' } });

  } catch (error) {
    console.error('[konnectbot error]', error);
    return NextResponse.json({ 
      success: true, 
      data: { reply: "Something went wrong. Please try again! 🔄", source: 'error' } 
    });
  }
}
