import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { Env } from '../types'
import { hashPassword, verifyPassword, generateOTP, generateInviteCode, createJWT } from '../utils/crypto'
import { sendEmail, otpEmailTemplate } from '../utils/email'
import { registerPage, loginPage, verifyEmailPage } from '../views/auth/index'

const auth = new Hono<{ Bindings: Env }>()

// ─── GET /register ────────────────────────────────────────────────────────────
auth.get('/register', (c) => {
  const ref = c.req.query('ref') || ''
  return c.html(registerPage({ inviteCode: ref }))
})

// ─── POST /register ───────────────────────────────────────────────────────────
auth.post('/register', async (c) => {
  const form = await c.req.formData()
  const full_name       = (form.get('full_name')       as string || '').trim()
  const email           = (form.get('email')           as string || '').trim().toLowerCase()
  const password        = (form.get('password')        as string || '')
  const confirm_password= (form.get('confirm_password')as string || '')
  const invitation_code = (form.get('invitation_code') as string || '').trim().toUpperCase()

  // Validation
  if (!full_name || !email || !password) {
    return c.html(registerPage({ error: 'All required fields must be filled.', values: { full_name, email } }))
  }
  if (password.length < 8) {
    return c.html(registerPage({ error: 'Password must be at least 8 characters.', values: { full_name, email } }))
  }
  if (password !== confirm_password) {
    return c.html(registerPage({ error: 'Passwords do not match.', values: { full_name, email } }))
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.html(registerPage({ error: 'Please enter a valid email address.', values: { full_name, email } }))
  }

  // Check existing email
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    return c.html(registerPage({ error: 'An account with this email already exists.', values: { full_name, email } }))
  }

  // Handle invitation code
  let invitedBy: string | null = null
  if (invitation_code) {
    const inviter = await c.env.DB.prepare('SELECT id FROM users WHERE invitation_code = ?').bind(invitation_code).first<{ id: string }>()
    if (!inviter) {
      return c.html(registerPage({ error: 'Invalid invitation code.', inviteCode: invitation_code, values: { full_name, email } }))
    }
    invitedBy = inviter.id
  }

  // Create user
  const password_hash  = await hashPassword(password)
  const my_invite_code = generateInviteCode()
  const userId         = crypto.randomUUID()

  const result = await c.env.DB.prepare(`
    INSERT INTO users (id, full_name, email, password_hash, invitation_code, invited_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(userId, full_name, email, password_hash, my_invite_code, invitedBy).run()

  if (!result.success) {
    return c.html(registerPage({ error: 'Registration failed. Please try again.', values: { full_name, email } }))
  }

  // Create wallet
  await c.env.DB.prepare('INSERT INTO user_wallets (user_id) VALUES (?)').bind(userId).run()
  const inviteid = crypto.randomUUID()

  // Record referral
  if (invitedBy) {
    await c.env.DB.prepare('INSERT INTO referrals (id, referrer_id, referred_id) VALUES (?,?,?)').bind(inviteid, invitedBy, userId).run()
  }

  // Send OTP
  await sendVerificationOTP(c.env, email, full_name)

  // Set pending session for OTP page
  setCookie(c, 'pending_email', email, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 900 })

  return c.redirect('/verify-email?email=' + encodeURIComponent(email))
})

// ─── GET /verify-email ────────────────────────────────────────────────────────
auth.get('/verify-email', (c) => {
  const email = c.req.query('email') || getCookie(c, 'pending_email') || ''
  if (!email) return c.redirect('/register')
  return c.html(verifyEmailPage({ email }))
})

// ─── POST /verify-email ───────────────────────────────────────────────────────
auth.post('/verify-email', async (c) => {
  const form  = await c.req.formData()
  const email = (form.get('email') as string || '').trim().toLowerCase()
  const otp   = (form.get('otp')   as string || '').trim()

  if (!email || otp.length !== 6) {
    return c.html(verifyEmailPage({ email, error: 'Please enter a valid 6-digit code.' }))
  }

  // Check OTP
  const now = new Date().toISOString()
  const record = await c.env.DB.prepare(`
    SELECT id FROM otp_codes
    WHERE email = ? AND code = ? AND type = 'email_verify' AND used = 0 AND expires_at > ?
    ORDER BY created_at DESC LIMIT 1
  `).bind(email, otp, now).first<{ id: number }>()

  if (!record) {
    return c.html(verifyEmailPage({ email, error: 'Invalid or expired code. Please request a new one.' }))
  }

  // Mark OTP used + verify user
  await c.env.DB.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').bind(record.id).run()
  await c.env.DB.prepare('UPDATE users SET email_verified = 1 WHERE email = ?').bind(email).run()

  const user = await c.env.DB.prepare('SELECT id, full_name, email FROM users WHERE email = ?').bind(email).first<{ id: number; full_name: string; email: string }>()
  if (!user) return c.redirect('/login')

  // FIX: Convert user.id (number) to string for the JWT `sub` claim
  const token = await createJWT({ sub: String(user.id), email: user.email, name: user.full_name, verified: true }, c.env.JWT_SECRET)
  setCookie(c, 'session', token, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 604800, path: '/' })
  deleteCookie(c, 'pending_email')

  return c.redirect('/user/WithdrawDetails')
})

// ─── POST /resend-otp ─────────────────────────────────────────────────────────
auth.post('/resend-otp', async (c) => {
  const form  = await c.req.formData()
  const email = (form.get('email') as string || '').trim().toLowerCase()

  const user = await c.env.DB.prepare('SELECT full_name FROM users WHERE email = ?').bind(email).first<{ full_name: string }>()
  if (!user) return c.redirect('/register')

  await sendVerificationOTP(c.env, email, user.full_name)

  return c.html(verifyEmailPage({ email, success: 'A new verification code has been sent to your email.' }))
})

// ─── GET /login ───────────────────────────────────────────────────────────────
auth.get('/login', (c) => {
  const redirect = c.req.query('redirect') || ''
  const session  = c.req.query('session')  || ''
  const error    = session === 'expired' ? 'Your session expired. Please sign in again.' : ''
  return c.html(loginPage({ error, redirect }))
})

// ─── POST /login ──────────────────────────────────────────────────────────────
auth.post('/login', async (c) => {
  const form     = await c.req.formData()
  const email    = (form.get('email')    as string || '').trim().toLowerCase()
  const password = (form.get('password') as string || '')
  const redirect = (form.get('redirect') as string || '/user/dashboard')

  if (!email || !password) {
    return c.html(loginPage({ error: 'Please fill in all fields.', email }))
  }

  const user = await c.env.DB.prepare(`
    SELECT id, full_name, email, password_hash, email_verified, profile_complete
    FROM users WHERE email = ?
  `).bind(email).first<{ id: number; full_name: string; email: string; password_hash: string; email_verified: number; profile_complete: number }>()

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.html(loginPage({ error: 'Invalid email or password.', email }))
  }

  if (!user.email_verified) {
    await sendVerificationOTP(c.env, email, user.full_name)
    setCookie(c, 'pending_email', email, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 900 })
    return c.redirect('/verify-email?email=' + encodeURIComponent(email))
  }

  // FIX: Convert user.id (number) to string for the JWT `sub` claim
  const token = await createJWT({ sub: String(user.id), email: user.email, name: user.full_name, verified: true }, c.env.JWT_SECRET)
  setCookie(c, 'session', token, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 604800, path: '/' })

  const safeRedirect = redirect.startsWith('/') ? redirect : '/user/dashboard'
  return c.redirect(safeRedirect)
})

// ─── GET /logout ──────────────────────────────────────────────────────────────
auth.get('/logout', (c) => {
  deleteCookie(c, 'session')
  return c.redirect('/login')
})

// ─── Helper ───────────────────────────────────────────────────────────────────
async function sendVerificationOTP(env: Env, email: string, name: string) {
  const otp     = generateOTP(6)
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  await env.DB.prepare(`
    INSERT INTO otp_codes (id, email, code, type, expires_at) VALUES (?, ?, ?, 'email_verify', ?)
  `).bind(crypto.randomUUID(), email, otp, expires).run()

  await sendEmail({
    to: email,
    toName: name,
    subject: 'Verify your SpinVault email',
    html: otpEmailTemplate(name, otp),
    apiKey: env.BREVO_API_KEY,
    fromEmail: env.BREVO_FROM_EMAIL,
    fromName: env.BREVO_FROM_NAME,
  })
}

export default auth
