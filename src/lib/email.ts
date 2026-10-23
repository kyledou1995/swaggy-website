/**
 * Transactional email (server-side only), sent through Resend's HTTP API.
 * Requires RESEND_API_KEY and a verified merchin.co domain in Resend.
 * EMAIL_FROM is optional (defaults to "Merchin <noreply@merchin.co>").
 */

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY is not configured' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Merchin <noreply@merchin.co>',
        to: [to],
        reply_to: 'support@merchin.co',
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) return { sent: false, error: `Resend error ${res.status}: ${await res.text()}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Failed to send email' };
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Branded wrapper matching the Supabase auth email templates. */
function layout(heading: string, bodyHtml: string, footerNote: string) {
  const font = 'Inter,Helvetica,Arial,sans-serif';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 0 24px 4px;"><a href="https://www.merchin.co" style="text-decoration:none;font-family:${font};font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#171717;">merchin<span style="color:#10b981;">&#9679;</span></a></td></tr>
<tr><td bgcolor="#ffffff" style="border:1px solid #e5e5e5;border-top:4px solid #10b981;border-radius:12px;padding:36px 36px 28px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:0 0 16px 0;font-family:${font};font-size:24px;line-height:32px;font-weight:700;color:#171717;">${heading}</td></tr>
<tr><td style="padding:0 0 24px 0;font-family:${font};font-size:15px;line-height:24px;color:#525252;">${bodyHtml}</td></tr>
<tr><td style="padding:20px 0 0 0;border-top:1px solid #f0f0f0;font-family:${font};font-size:13px;line-height:20px;color:#737373;">${footerNote}</td></tr>
</table></td></tr>
<tr><td align="center" style="padding:24px 16px 0 16px;font-family:${font};font-size:12px;line-height:18px;color:#a3a3a3;">Merchin &middot; Sourcing made simple for ecommerce brands<br>Questions? <a href="mailto:support@merchin.co" style="color:#737373;text-decoration:underline;">support@merchin.co</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function accountDeletedEmail(name: string) {
  const first = (name || '').trim().split(/\s+/)[0] || 'there';
  const safeFirst = escapeHtml(first);
  return {
    subject: 'Your Merchin account has been deleted',
    html: layout(
      'Your account has been deleted',
      `Hi ${safeFirst},<br><br>This is a confirmation that your Merchin account and its associated data, including orders, messages, and uploaded files, have been permanently deleted. You will no longer be able to sign in with this email address.<br><br>If you'd like to work with us again in the future, you're always welcome to create a new account at <a href="https://www.merchin.co" style="color:#059669;">merchin.co</a>.`,
      `If you didn't expect this, please contact <a href="mailto:support@merchin.co" style="color:#059669;">support@merchin.co</a>.`
    ),
    text: `Hi ${first},\n\nThis is a confirmation that your Merchin account and its associated data, including orders, messages, and uploaded files, have been permanently deleted. You will no longer be able to sign in with this email address.\n\nIf you'd like to work with us again in the future, you're always welcome to create a new account at https://www.merchin.co.\n\nIf you didn't expect this, please contact support@merchin.co.\n\n— The Merchin team`,
  };
}
