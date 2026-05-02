interface BrevoEmailParams {
  to: string
  toName: string
  subject: string
  html: string
  apiKey: string
  fromEmail: string
  fromName: string
}

export async function sendEmail(params: BrevoEmailParams): Promise<boolean> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': params.apiKey,
      },
      body: JSON.stringify({
        sender:    { name: params.fromName, email: params.fromEmail },
        to:        [{ email: params.to, name: params.toName }],
        subject:   params.subject,
        htmlContent: params.html,
      }),
    })
    return response.ok
  } catch (err) {
    console.error('Email send error:', err)
    return false
  }
}

export function otpEmailTemplate(name: string, otp: string, appName = 'spinvault'): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify Your Email - ${appName}</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:12px;">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;">🎰</div>
            <span style="font-size:24px;font-weight:700;color:#f59e0b;letter-spacing:-0.5px;">${appName}</span>
          </div>
        </td></tr>
        <tr><td style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px;text-align:center;">
          <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;">Verify Your Email</h1>
          <p style="color:#94a3b8;font-size:15px;margin:0 0 32px;">Hi ${name}, enter this code to verify your email address.</p>
          <div style="background:#0d1117;border:2px solid #f59e0b;border-radius:16px;padding:24px;margin:0 0 32px;display:inline-block;">
            <span style="font-size:40px;font-weight:700;color:#f59e0b;letter-spacing:8px;font-family:monospace;">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0;">This code expires in <strong style="color:#f59e0b;">15 minutes</strong>.</p>
          <p style="color:#475569;font-size:12px;margin:16px 0 0;">If you didn't create an account, ignore this email.</p>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="color:#334155;font-size:12px;margin:0;">© 2024 ${appName}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
