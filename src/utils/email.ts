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

// ─── Shared layout wrapper ────────────────────────────────────────────────────
function emailWrapper(content: string, appName = 'SpinVault'): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Logo Header -->
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:12px;">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;">🎰</div>
            <span style="font-size:24px;font-weight:700;color:#f59e0b;letter-spacing:-0.5px;">${appName}</span>
          </div>
        </td></tr>
        <!-- Content Card -->
        <tr><td style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="color:#334155;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          <p style="color:#1e293b;font-size:11px;margin:6px 0 0;">This is an automated notification. Please do not reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── OTP Verification Email ───────────────────────────────────────────────────
export function otpEmailTemplate(name: string, otp: string, appName = 'SpinVault'): string {
  return emailWrapper(`
    <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;text-align:center;">Verify Your Email</h1>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 32px;text-align:center;">Hi ${name}, enter this code to verify your email address.</p>
    <div style="background:#0d1117;border:2px solid #f59e0b;border-radius:16px;padding:24px;margin:0 0 32px;text-align:center;">
      <span style="font-size:40px;font-weight:700;color:#f59e0b;letter-spacing:8px;font-family:monospace;">${otp}</span>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">This code expires in <strong style="color:#f59e0b;">15 minutes</strong>.</p>
    <p style="color:#475569;font-size:12px;margin:16px 0 0;text-align:center;">If you didn't create an account, ignore this email.</p>
  `, appName)
}

// ─── Deposit Success Email ────────────────────────────────────────────────────
export function depositSuccessEmailTemplate(opts: {
  name: string
  amount: number
  planName: string
  dailySpins: number
  newBalance: number
  appName?: string
}): string {
  const { name, amount, planName, dailySpins, newBalance, appName = 'SpinVault' } = opts

  return emailWrapper(`
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05));border:2px solid rgba(34,197,94,0.4);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">✅</div>
    </div>

    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Deposit Confirmed!</h1>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;text-align:center;">Hi ${name}, your deposit has been confirmed and your account is ready.</p>

    <!-- Amount highlight -->
    <div style="background:linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.03));border:1px solid rgba(34,197,94,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Amount Deposited</p>
      <p style="color:#4ade80;font-size:36px;font-weight:700;font-family:monospace;margin:0;">$${amount.toFixed(2)}</p>
    </div>

    <!-- Details table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${[
        ['Plan Activated', planName],
        ['Daily Spins Unlocked', `${dailySpins} spins / day`],
        ['New Balance', `$${newBalance.toFixed(2)}`],
      ].map(([label, value]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#64748b;font-size:13px;">${label}</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#f1f5f9;font-size:13px;font-weight:600;text-align:right;">${value}</td>
      </tr>`).join('')}
    </table>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="https://spinvault.pages.dev/user/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0d1117;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        🎰 Start Spinning Now
      </a>
    </div>
  `, appName)
}

// ─── Withdrawal Request Email ─────────────────────────────────────────────────
export function withdrawalRequestEmailTemplate(opts: {
  name: string
  amount: number
  txnId: string
  remainingBalance: number
  accountLast4: string
  appName?: string
}): string {
  const { name, amount, txnId, remainingBalance, accountLast4, appName = 'SpinVault' } = opts

  return emailWrapper(`
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.05));border:2px solid rgba(245,158,11,0.4);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">🏧</div>
    </div>

    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Withdrawal Requested</h1>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;text-align:center;">Hi ${name}, we've received your withdrawal request and it's being processed.</p>

    <!-- Amount highlight -->
    <div style="background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03));border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Withdrawal Amount</p>
      <p style="color:#fbbf24;font-size:36px;font-weight:700;font-family:monospace;margin:0;">$${amount.toFixed(2)}</p>
    </div>

    <!-- Details table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${[
        ['Transaction ID', txnId],
        ['To Account', `••••${accountLast4}`],
        ['Remaining Balance', `$${remainingBalance.toFixed(2)}`],
        ['Processing Time', '1–3 Business Days'],
        ['Status', 'Pending Review'],
      ].map(([label, value], i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#64748b;font-size:13px;">${label}</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:${i === 4 ? '#fbbf24' : '#f1f5f9'};font-size:13px;font-weight:600;text-align:right;">${value}</td>
      </tr>`).join('')}
    </table>

    <!-- Info box -->
    <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:10px;padding:14px 16px;margin-bottom:24px;">
      <p style="color:#93c5fd;font-size:12px;margin:0;line-height:1.6;">
        💡 <strong>What's next?</strong> Our team will review and process your withdrawal within 1–3 business days. You'll receive another email once the payment is sent.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="https://spinvault.pages.dev/user/withdraw"
        style="display:inline-block;border:1px solid rgba(245,158,11,0.5);color:#fbbf24;font-weight:600;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">
        View Withdrawal Status →
      </a>
    </div>
  `, appName)
}

// ─── Withdrawal Paid Email ────────────────────────────────────────────────────
export function withdrawalPaidEmailTemplate(opts: {
  name: string
  amount: number
  txnId: string
  accountLast4: string
  appName?: string
}): string {
  const { name, amount, txnId, accountLast4, appName = 'SpinVault' } = opts

  return emailWrapper(`
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,rgba(168,85,247,0.2),rgba(168,85,247,0.05));border:2px solid rgba(168,85,247,0.4);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">🎉</div>
    </div>

    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Payment Sent!</h1>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;text-align:center;">Great news, ${name}! Your withdrawal has been processed and the money is on its way.</p>

    <!-- Amount highlight -->
    <div style="background:linear-gradient(135deg,rgba(168,85,247,0.1),rgba(168,85,247,0.03));border:1px solid rgba(168,85,247,0.4);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Amount Paid</p>
      <p style="color:#c084fc;font-size:36px;font-weight:700;font-family:monospace;margin:0;">$${amount.toFixed(2)}</p>
    </div>

    <!-- Details table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${[
        ['Transaction ID', txnId],
        ['Paid To Account', `••••${accountLast4}`],
        ['Status', '✅ Paid'],
        ['Arrival', '1–2 Business Days'],
      ].map(([label, value], i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#64748b;font-size:13px;">${label}</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:${i === 2 ? '#4ade80' : '#f1f5f9'};font-size:13px;font-weight:600;text-align:right;">${value}</td>
      </tr>`).join('')}
    </table>

    <!-- Celebration box -->
    <div style="background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(245,158,11,0.05));border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:14px 16px;margin-bottom:24px;text-align:center;">
      <p style="color:#c4b5fd;font-size:13px;margin:0;line-height:1.6;">
        🚀 Keep spinning to earn more! Your spins reset daily.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="https://spinvault.pages.dev/user/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0d1117;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        🎰 Spin Again
      </a>
    </div>
  `, appName)
}
