import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env, Plan, Deposit, SpinResult, WithdrawDetail } from '../types'
import { authMiddleware, verifiedMiddleware } from '../middleware/auth'
import { withdrawDetailsPage } from '../views/user/withdraw-details'
import { depositPage } from '../views/user/deposit'
import { dashboardPage } from '../views/user/dashboard'
import { withdrawPage } from '../views/user/withdraw'
import { referralsPage } from '../views/user/referrals'
import { generateTxnId } from '../utils/shared'

function sanitize(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const user = new Hono<{ Bindings: Env }>()

// All user routes require auth + verified email
user.use('*', authMiddleware)
user.use('*', verifiedMiddleware)

// ─── GET /user/dashboard ─────────────────────────────────────────────────────
user.get('/dashboard', async (c) => {
  const me = c.get('user')

  const today = new Date().toISOString().split('T')[0]
  const [userRes, walletRes, depositRes, spinsRes, spinsTodayRes] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, full_name, email, invitation_code FROM users WHERE id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT * FROM user_wallets WHERE user_id = ?').bind(me.sub),
    c.env.DB.prepare(`SELECT d.*, p.name as plan_name, p.earning_rate FROM deposits d JOIN plans p ON d.plan_id = p.id WHERE d.user_id = ? AND d.status = 'confirmed' ORDER BY d.created_at DESC LIMIT 1`).bind(me.sub),
    c.env.DB.prepare('SELECT * FROM spin_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').bind(me.sub),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM spin_results WHERE user_id = ? AND created_at >= ?').bind(me.sub, today + 'T00:00:00'),
  ])

  const userRow = userRes.results[0] as any
  const wallet = walletRes.results[0] as any
  const activeDeposit = depositRes.results[0] as any || null

  if (!userRow || !wallet) return c.redirect('/login')

  return c.html(dashboardPage({
    user: userRow,
    wallet,
    activeDeposit,
    recentSpins: spinsRes.results as SpinResult[],
    totalSpinsToday: (spinsTodayRes.results[0] as any)?.cnt || 0,
  }))
})

// ─── GET /user/WithdrawDetails ────────────────────────────────────────────────
user.get('/WithdrawDetails', async (c) => {
  const me = c.get('user')

  const [userRes, existingRes, walletRes] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, full_name, email FROM users WHERE id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT * FROM withdraw_details WHERE user_id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT balance FROM user_wallets WHERE user_id = ?').bind(me.sub),
  ])

  const userRow = userRes.results[0] as any
  const existing = existingRes.results[0] as any
  const wallet = walletRes.results[0] as any

  if (!userRow) return c.redirect('/login')

  return c.html(withdrawDetailsPage({
    user: userRow,
    existing: existing ? {
      bank_country: existing.bank_country,
      bank_name: existing.bank_name,
      account_holder_name: existing.account_holder_name,
      account_number: existing.account_number,
      routing_number: existing.routing_number ?? undefined,
      swift_code: existing.swift_code ?? undefined,
    } : null,
    balance: wallet?.balance || 0,
  }))
})

// ─── POST /user/WithdrawDetails ───────────────────────────────────────────────
user.post('/WithdrawDetails', async (c) => {
  const me   = c.get('user')
  const form = await c.req.formData()

  const bank_country        = (form.get('bank_country')        as string || '').trim()
  const bank_name           = (form.get('bank_name')           as string || '').trim()
  const account_holder_name = (form.get('account_holder_name') as string || '').trim()
  const account_number      = (form.get('account_number')      as string || '').trim()
  const routing_number      = (form.get('routing_number')      as string || '').trim() || null
  const swift_code          = (form.get('swift_code')          as string || '').trim() || null

  const [userRes, walletRes] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, full_name, email FROM users WHERE id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT balance FROM user_wallets WHERE user_id = ?').bind(me.sub),
  ])

  const userRow = userRes.results[0] as any
  const wallet = walletRes.results[0] as any

  if (!bank_country || !bank_name || !account_number) {
    return c.html(withdrawDetailsPage({
      user: userRow,
      error: 'Please fill in all required fields.',
      balance: wallet?.balance || 0,
    }))
  }

  const isInternational = bank_country !== 'PK'
  if (isInternational && (!routing_number || !swift_code)) {
    return c.html(withdrawDetailsPage({
      user: userRow,
      error: 'Routing number and SWIFT code are required for international accounts.',
      balance: wallet?.balance || 0,
    }))
  }

  await c.env.DB.prepare(`
    INSERT INTO withdraw_details (user_id, bank_country, bank_name, account_holder_name, account_number, routing_number, swift_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      bank_country = excluded.bank_country,
      bank_name = excluded.bank_name,
      account_holder_name = excluded.account_holder_name,
      account_number = excluded.account_number,
      routing_number = excluded.routing_number,
      swift_code = excluded.swift_code,
      updated_at = datetime('now')
  `).bind(me.sub, bank_country, bank_name, account_holder_name, account_number, routing_number, swift_code).run()

  await c.env.DB.prepare('UPDATE users SET profile_complete = 1 WHERE id = ?').bind(me.sub).run()

  return c.redirect('/user/deposit?success=Bank+details+saved+successfully')
})

// ─── GET /user/deposit ────────────────────────────────────────────────────────
user.get('/deposit', async (c) => {
  const me      = c.get('user')
  const success = sanitize(c.req.query('success') || '')
  const error   = sanitize(c.req.query('error')   || '')

  const [userRes, walletRes, plansRes] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, full_name, email FROM users WHERE id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT balance FROM user_wallets WHERE user_id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY min_deposit ASC').bind(),
  ])

  const userRow = userRes.results[0] as any
  const wallet = walletRes.results[0] as any
  const plansResult = { results: plansRes.results as Plan[] }

  if (!userRow) return c.redirect('/login')

  return c.html(depositPage({
    user: userRow,
    plans: plansResult.results || [],
    balance: wallet?.balance || 0,
    error: error || undefined,
    success: success || undefined,
    appUrl: c.env.APP_URL,
  }))
})

// ─── POST /user/deposit ───────────────────────────────────────────────────────
user.post('/deposit', async (c) => {
  const me   = c.get('user')
  const form = await c.req.formData()

  const plan_id        = (form.get('plan_id')         as string || '').trim()
  const amount         = parseFloat(form.get('amount') as string || '0')
  const payment_method = (form.get('payment_method')   as string || 'manual')
  const transaction_ref= (form.get('transaction_ref')  as string || '').trim()

  if (!plan_id || amount <= 0) {
    return c.redirect('/user/deposit?error=Invalid+deposit+request')
  }

  // Validate plan
  const plan = await c.env.DB.prepare('SELECT * FROM plans WHERE id = ? AND active = 1').bind(plan_id).first<Plan>()
  if (!plan || amount < plan.min_deposit || amount > plan.max_deposit) {
    return c.redirect('/user/deposit?error=Amount+does+not+match+selected+plan')
  }

  const depositId = crypto.randomUUID()
  await c.env.DB.prepare(`
   INSERT INTO deposits (id, user_id, plan_id, amount, payment_method, transaction_ref, status)
   VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).bind(depositId, me.sub, plan_id, amount, payment_method, transaction_ref || null).run()

  return c.redirect('/user/dashboard?success=Deposit+submitted+for+review')
})

// ─── GET /user/withdraw ───────────────────────────────────────────────────────
user.get('/withdraw', async (c) => {
  const me      = c.get('user')
  const success = sanitize(c.req.query('success') || '')
  const error   = sanitize(c.req.query('error')   || '')

  const [userRes, walletRes, detailsRes, historyRes] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, full_name FROM users WHERE id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT balance FROM user_wallets WHERE user_id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT user_id, account_number FROM withdraw_details WHERE user_id = ?').bind(me.sub),
    c.env.DB.prepare(`SELECT wr.*, wd.account_number FROM withdrawal_requests wr LEFT JOIN withdraw_details wd ON wd.user_id = wr.user_id WHERE wr.user_id = ? ORDER BY wr.created_at DESC LIMIT 20
    `).bind(me.sub),
  ])

  const userRow = userRes.results[0] as any
  const wallet = walletRes.results[0] as any
  const details = detailsRes.results[0]
  const history = { results: historyRes.results }

  if (!userRow) return c.redirect('/login')

  return c.html(withdrawPage({
    user: userRow,
    balance: wallet?.balance || 0,
    hasWithdrawDetails: !!details,
    withdrawHistory: history.results as any[] || [],
    error: error || undefined,
    success: success || undefined,
  }))
})

// ─── POST /user/withdraw ──────────────────────────────────────────────────────
user.post('/withdraw', async (c) => {
  const me   = c.get('user')
  const form = await c.req.formData()

  const amount = parseFloat(form.get('amount') as string || '0')
  const note   = (form.get('note') as string || '').trim()

  const wallet = await c.env.DB.prepare('SELECT balance FROM user_wallets WHERE user_id = ?').bind(me.sub).first<{ balance: number }>()
  if (!wallet) return c.redirect('/user/withdraw?error=Account+not+found')

  if (amount < 10 || amount > wallet.balance) {
    return c.redirect('/user/withdraw?error=Invalid+withdrawal+amount')
  }

  const details = await c.env.DB.prepare('SELECT user_id FROM withdraw_details WHERE user_id = ?').bind(me.sub).first()
  if (!details) {
    return c.redirect('/user/WithdrawDetails')
  }

  const deductResult = await c.env.DB.prepare(
    'UPDATE user_wallets SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE user_id = ? AND balance >= ?'
  ).bind(amount, amount, me.sub, amount).run()

  if (deductResult.meta.changes === 0) {
    return c.redirect('/user/withdraw?error=Insufficient+balance.+Please+refresh+and+try+again.')
  }

  await c.env.DB.prepare('INSERT INTO withdrawal_requests (user_id, txn_id, amount, note, payment_method) VALUES (?,?,?,?,?)')
  .bind(me.sub, generateTxnId(), amount, note || null, 'bank_transfer').run()

  return c.redirect('/user/withdraw?success=Withdrawal+request+submitted+successfully')
})

// ─── GET /user/referrals ──────────────────────────────────────────────────────
user.get('/referrals', async (c) => {
  const me = c.get('user')

  const [userRes, walletRes, referralsRes] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, full_name, invitation_code FROM users WHERE id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT balance FROM user_wallets WHERE user_id = ?').bind(me.sub),
    c.env.DB.prepare(`SELECT u.full_name as referred_name, u.email as referred_email, u.created_at as joined_at, COALESCE(SUM(CASE WHEN d.status = 'confirmed' THEN d.amount ELSE 0 END), 0) as deposited FROM referrals r JOIN users u ON r.referred_id = u.id LEFT JOIN deposits d ON d.user_id = u.id WHERE r.referrer_id = ? GROUP BY u.id ORDER BY u.created_at DESC`).bind(me.sub),
  ])

  const userRow = userRes.results[0] as any
  const wallet = walletRes.results[0] as any
  const referrals = { results: referralsRes.results }

  if (!userRow) return c.redirect('/login')

  return c.html(referralsPage({
    user: userRow,
    balance: wallet?.balance || 0,
    inviteCode: userRow.invitation_code,
    referrals: referrals.results as any[],
    appUrl: c.env.APP_URL,
  }))
})

// ─── GET /user/profile ────────────────────────────────────────────────────────
user.get('/profile', async (c) => {
  const me = c.get('user')

  const [userRes, walletRes] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, full_name, email, invitation_code, created_at FROM users WHERE id = ?').bind(me.sub),
    c.env.DB.prepare('SELECT * FROM user_wallets WHERE user_id = ?').bind(me.sub),
  ])

  const userRow = userRes.results[0] as any
  const wallet = walletRes.results[0] as any

  if (!userRow) return c.redirect('/login')

  // Simple profile page
  const html = `
  <div class="max-w-xl mx-auto px-4 py-8 space-y-6">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-3xl font-bold text-dark-400">
        ${userRow.full_name[0].toUpperCase()}
      </div>
      <div>
        <h1 class="font-display text-xl font-bold text-white">${userRow.full_name}</h1>
        <p class="text-gray-400 text-sm">${userRow.email}</p>
        <p class="text-xs text-gray-600">Member since ${new Date(userRow.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="stat-card"><p class="text-xs text-gray-500">Balance</p><p class="text-xl font-bold text-gold-400 font-mono">$${(wallet?.balance||0).toFixed(2)}</p></div>
      <div class="stat-card"><p class="text-xs text-gray-500">Total Earned</p><p class="text-xl font-bold text-green-400 font-mono">$${(wallet?.total_earned||0).toFixed(2)}</p></div>
      <div class="stat-card"><p class="text-xs text-gray-500">Deposited</p><p class="text-xl font-bold text-white font-mono">$${(wallet?.total_deposited||0).toFixed(2)}</p></div>
      <div class="stat-card"><p class="text-xs text-gray-500">Withdrawn</p><p class="text-xl font-bold text-white font-mono">$${(wallet?.total_withdrawn||0).toFixed(2)}</p></div>
    </div>

    <div class="card p-5 space-y-3">
      <h2 class="font-bold text-white text-sm">Account Settings</h2>
      <a href="/user/WithdrawDetails" class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
        <span class="text-sm text-gray-300">Bank Details</span>
        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </a>
      <a href="/user/referrals" class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
        <span class="text-sm text-gray-300">My Invite Code: <span class="font-mono text-gold-400">${userRow.invitation_code}</span></span>
        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </a>
      <a href="/logout" class="flex items-center justify-between p-3 rounded-xl hover:bg-red-500/10 transition-colors border border-red-500/10">
        <span class="text-sm text-red-400">Sign Out</span>
        <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
      </a>
    </div>
  </div>`

  const { layout } = await import('../views/layout')
  return c.html(layout(html, {
    title: 'Profile – SpinVault',
    activePage: 'profile',
    userName: userRow.full_name,
    userBalance: wallet?.balance || 0,
  }))
})

export default user
