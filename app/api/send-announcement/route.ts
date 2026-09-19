import { NextRequest, NextResponse } from 'next/server';

interface Recipient {
  email: string;
  name: string;
}

interface SendPayload {
  title: string;
  body: string;
  recipients: Recipient[];
  senderEmail?: string;
  senderName?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// In-memory rate limiting map (IP/session -> timestamps)
const rateLimitMap = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  // 1. Session verification
  const sessionCookie = request.cookies.get('dims_staff_session');
  if (!sessionCookie || sessionCookie.value !== '1') {
    return NextResponse.json(
      {
        success: false,
        isSimulated: false,
        sentCount: 0,
        failedCount: 0,
        details: 'Unauthorized: Valid ASR staff session cookie required.',
      },
      { status: 401 }
    );
  }

  // 2. Rate limiting check (max 10 sends per minute)
  const clientIdentifier = request.headers.get('x-forwarded-for') || 'staff-session';
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientIdentifier) || [];
  const recentTimestamps = timestamps.filter((t) => now - t < 60000);
  if (recentTimestamps.length >= 10) {
    return NextResponse.json(
      {
        success: false,
        isSimulated: false,
        sentCount: 0,
        failedCount: 0,
        details: 'Rate limit exceeded: Please wait before sending more announcements.',
      },
      { status: 429 }
    );
  }
  recentTimestamps.push(now);
  rateLimitMap.set(clientIdentifier, recentTimestamps);

  try {
    const payload: SendPayload = await request.json();
    const {
      title,
      body,
      recipients,
      senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL || 'aseanresidences@firstasia.edu.ph',
      senderName = process.env.BREVO_SENDER_NAME || process.env.NEXT_PUBLIC_BREVO_SENDER_NAME || 'ASEAN Student Residences',
    } = payload;

    if (!title || !body || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          isSimulated: false,
          sentCount: 0,
          failedCount: 0,
          details: 'Missing required fields: title, body, or valid recipients list.',
        },
        { status: 400 }
      );
    }

    // Strictly read server environment variable (never client-supplied)
    const activeApiKey =
      process.env.BREVO_API_KEY ||
      process.env.NEXT_PUBLIC_BREVO_API_KEY ||
      '';

    // If key is empty or placeholder, run in safe standalone simulation mode
    if (!activeApiKey || activeApiKey.includes('your-brevo') || activeApiKey.trim() === '') {
      return NextResponse.json({
        success: true,
        isSimulated: true,
        sentCount: recipients.length,
        failedCount: 0,
        messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Dispatched to ${recipients.length} recipients in Standalone Simulation Mode. Add your Brevo API key in Settings for direct cloud delivery.`,
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F8F6; color: #141414; margin: 0; padding: 24px; line-height: 1.6; }
            .container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E4E4E0; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
            .header { border-bottom: 1px solid #E4E4E0; padding-bottom: 18px; margin-bottom: 24px; }
            .badge { display: inline-block; background-color: #EEF2FF; color: #4F46E5; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
            .title { font-size: 22px; font-weight: 700; color: #141414; margin: 16px 0; letter-spacing: -0.02em; }
            .body { font-size: 15px; color: #2C2C2A; white-space: pre-line; line-height: 1.7; margin-bottom: 32px; }
            .footer { border-top: 1px solid #E4E4E0; padding-top: 20px; font-size: 12px; color: #8C8C8A; text-align: center; }
            .footer p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">Official ASR Notice</span>
            </div>
            <h1 class="title">${escapeHtml(title)}</h1>
            <div class="body">${escapeHtml(body)}</div>
            <div class="footer">
              <p><strong>DIMS</strong> — Dormitory & Inventory Management System</p>
              <p>ASR School Field Campus · This is an official notice to dorm residents.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': activeApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: recipients.map((r) => ({
          email: r.email,
          name: r.name,
        })),
        subject: title,
        htmlContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        isSimulated: false,
        sentCount: 0,
        failedCount: recipients.length,
        details: errorData.message || `Brevo API HTTP ${brevoResponse.status}: ${brevoResponse.statusText}`,
      });
    }

    const data = await brevoResponse.json();
    return NextResponse.json({
      success: true,
      isSimulated: false,
      sentCount: recipients.length,
      failedCount: 0,
      messageId: data.messageId,
      details: `Successfully dispatched to ${recipients.length} dormers via Brevo API.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error sending email';
    return NextResponse.json(
      {
        success: false,
        isSimulated: false,
        sentCount: 0,
        failedCount: 0,
        details: message,
      },
      { status: 500 }
    );
  }
}
