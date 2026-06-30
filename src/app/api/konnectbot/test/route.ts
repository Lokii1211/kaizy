import { NextResponse } from 'next/server';

// ═══════════════════════════════════════
// GET /api/konnectbot/test — Debug Claude API
// ═══════════════════════════════════════

export async function GET() {
  const key = process.env.CLAUDE_API_KEY || '';
  
  if (!key) {
    return NextResponse.json({ error: 'CLAUDE_API_KEY not set', keyLength: 0 });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "Hello from Kaizy!" in exactly 5 words.' }],
      }),
    });

    const statusCode = response.status;
    const responseText = await response.text();

    let parsed;
    try { parsed = JSON.parse(responseText); } catch { parsed = responseText; }

    return NextResponse.json({
      keySet: true,
      keyLength: key.length,
      keyPrefix: key.substring(0, 7) + '...',
      statusCode,
      ok: response.ok,
      response: parsed,
    });
  } catch (error) {
    return NextResponse.json({
      keySet: true,
      keyLength: key.length,
      error: String(error),
    });
  }
}
