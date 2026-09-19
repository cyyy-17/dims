/**
 * Brevo (Sendinblue) Transactional & Bulk Announcement Email Dispatcher
 * Directly integrates with Brevo REST API v3
 */

export interface SendAnnouncementParams {
  title: string;
  body: string;
  recipients: Array<{
    email: string;
    name: string;
  }>;
  senderEmail?: string;
  senderName?: string;
  apiKey?: string;
}

export interface BrevoSendResult {
  success: boolean;
  isSimulated: boolean;
  sentCount: number;
  failedCount: number;
  messageId?: string;
  details: string;
}

export async function sendBrevoAnnouncement({
  title,
  body,
  recipients,
  senderEmail,
  senderName,
  apiKey,
}: SendAnnouncementParams): Promise<BrevoSendResult> {
  // If in browser, dispatch through secure server-side Next.js route
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          recipients,
          senderEmail,
          senderName,
          apiKey: apiKey || localStorage.getItem('dims_brevo_api_key') || undefined,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err: unknown) {
      return {
        success: false,
        isSimulated: false,
        sentCount: 0,
        failedCount: recipients.length,
        details: err instanceof Error ? err.message : 'Network error communicating with server',
      };
    }
  }

  // Server-side direct dispatch
  const activeApiKey =
    apiKey ||
    process.env.BREVO_API_KEY ||
    process.env.NEXT_PUBLIC_BREVO_API_KEY ||
    '';

  const defaultSenderEmail =
    senderEmail ||
    process.env.BREVO_SENDER_EMAIL ||
    process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL ||
    'aseanresidences@firstasia.edu.ph';

  const defaultSenderName =
    senderName ||
    process.env.BREVO_SENDER_NAME ||
    process.env.NEXT_PUBLIC_BREVO_SENDER_NAME ||
    'ASEAN Student Residences';

  if (!activeApiKey || activeApiKey.includes('your-brevo') || activeApiKey.trim() === '') {
    return {
      success: true,
      isSimulated: true,
      sentCount: recipients.length,
      failedCount: 0,
      messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      details: `Dispatched to ${recipients.length} recipients in Standalone Simulation Mode.`,
    };
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #F8F8F6; color: #141414; padding: 24px; }
            .container { max-width: 580px; margin: 0 auto; background: #FFF; border: 1px solid #E4E4E0; border-radius: 12px; padding: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(body)}</p>
          </div>
        </body>
      </html>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': activeApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: defaultSenderName, email: defaultSenderEmail },
        to: recipients.map((r) => ({ email: r.email, name: r.name })),
        subject: title,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        isSimulated: false,
        sentCount: 0,
        failedCount: recipients.length,
        details: errorData.message || `Brevo API HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      isSimulated: false,
      sentCount: recipients.length,
      failedCount: 0,
      messageId: data.messageId,
      details: `Successfully dispatched to ${recipients.length} dormers via Brevo API.`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      isSimulated: false,
      sentCount: 0,
      failedCount: recipients.length,
      details: err instanceof Error ? err.message : 'Network error communicating with Brevo',
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
