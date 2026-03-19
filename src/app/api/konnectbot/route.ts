import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════
// POST /api/konnectbot — Claude AI Chat
// Real AI assistant for Kaizy platform
// ═══════════════════════════════════════

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const SYSTEM_PROMPT = `You are KaizyBot, the AI assistant for Kaizy — India's workforce platform connecting skilled workers (electricians, plumbers, mechanics, AC repair, carpenters, painters) with hirers.

You help users with:
- Finding the right worker for their problem
- Understanding pricing (base rates: Electrician ₹400/hr, Plumber ₹350/hr, Mechanic ₹500/hr, AC Repair ₹600/hr, Carpenter ₹400/hr, Painter ₹300/hr)
- Explaining how Kaizy works (Uber model: Book → Match → Track → Pay → Review)
- Emergency SOS guidance (15km radius search, 1.8x emergency pricing)
- Payment info (Razorpay integration, UPI support)
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

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ 
        success: true, 
        data: { reply: "I'm being set up! The AI key hasn't been configured yet. Please contact support." } 
      });
    }

    // Build conversation messages
    const messages = [];
    if (history?.length) {
      for (const h of history.slice(-10)) { // Last 10 messages for context
        messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text });
      }
    }
    messages.push({ role: 'user', content: message });

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[claude error]', response.status, errorText);
      return NextResponse.json({ 
        success: true, 
        data: { reply: "I'm having trouble connecting right now. Please try again in a moment! 🔄" } 
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "I couldn't generate a response. Please try again.";

    return NextResponse.json({ success: true, data: { reply } });
  } catch (error) {
    console.error('[konnectbot error]', error);
    return NextResponse.json({ 
      success: true, 
      data: { reply: "Something went wrong. Please try again! 🔄" } 
    });
  }
}
