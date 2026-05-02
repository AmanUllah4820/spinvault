import { verifyJWT, weightedSpinResult, WHEEL_SEGMENTS } from '../utils/crypto'
import { HandleSuccess, HandleFailure } from '../views/payment/result'
import { handlePayFastIPN } from './handleIPN';
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from '../types'
import { payfastHandler } from './PayFast';
import { GenOrderId } from '../utils/shared'
import { authMiddleware } from '../middleware/auth'

const api = new Hono<{ Bindings: Env }>()

// ─── GET /api/payouts/recent (PUBLIC — no auth) ───────────────────────────────
api.get('/payouts/recent', async (c) => {
  const rows = await c.env.DB.prepare(`
    SELECT
      wr.amount,
      wr.created_at,
      wd.bank_country,
      u.full_name
    FROM withdrawal_requests wr
    JOIN users u ON u.id = wr.user_id
    LEFT JOIN withdraw_details wd ON wd.user_id = wr.user_id
    WHERE wr.status = 'paid'
    ORDER BY wr.created_at DESC
    LIMIT 20
  `).all<any>()

  const COUNTRY_FLAGS: Record<string, string> = {
    PK:'🇵🇰', US:'🇺🇸', GB:'🇬🇧', AE:'🇦🇪', SA:'🇸🇦',
    CA:'🇨🇦', AU:'🇦🇺', DE:'🇩🇪', IN:'🇮🇳', NG:'🇳🇬',
    PH:'🇵🇭', ID:'🇮🇩', TR:'🇹🇷', EG:'🇪🇬', BD:'🇧🇩',
    FR:'🇫🇷', BR:'🇧🇷', MX:'🇲🇽', ZA:'🇿🇦', KE:'🇰🇪',
  }

  const masked = rows.results.map(r => {
    const parts = (r.full_name as string).trim().split(' ')
    const name = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '')
    const flag = COUNTRY_FLAGS[r.bank_country as string] || '🌍'
    const minsAgo = Math.floor(
      (Date.now() - new Date(r.created_at).getTime()) / 60000
    )
    const timeLabel =
      minsAgo < 2    ? 'just now' :
      minsAgo < 60   ? `${minsAgo}m ago` :
      minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` :
                       `${Math.floor(minsAgo / 1440)}d ago`

    return {
      name,
      flag,
      amount: (r.amount as number).toFixed(2),
      time: timeLabel,
    }
  })

  return c.json({ payouts: masked })
})

// ─── POST /api/spin ───────────────────────────────────────────────────────────
api.post('/spin', authMiddleware, async (c) => {
  const me = c.get('user')
  const SPIN_FEE = parseFloat(c.env.SPIN_FEE || '0.50')
  const FREE_SPIN_BASE = 1.00 // virtual $1 base for free spins

  const [wallet, activeDeposit] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM user_wallets WHERE user_id = ?').bind(me.sub).first<any>(),
    c.env.DB.prepare(`
      SELECT d.id, d.amount, p.earning_rate, p.daily_spins
      FROM deposits d JOIN plans p ON d.plan_id = p.id
      WHERE d.user_id = ? AND d.status = 'confirmed'
      ORDER BY d.created_at DESC LIMIT 1
    `).bind(me.sub).first<any>(),
  ])

  if (!wallet) return c.json({ error: 'Wallet not found.' }, 400)

  // ── Auto-reset free spin every 24 hours ──────────────────────────────────
  const now = new Date()
  const resetAt = wallet.reset_at ? new Date(wallet.reset_at) : null
  const needsReset = !resetAt || (now.getTime() - resetAt.getTime()) >= 24 * 60 * 60 * 1000

  if (needsReset && wallet.free_left === 0) {
    await c.env.DB.prepare(`
      UPDATE user_wallets SET free_left = 1, reset_at = datetime('now') WHERE user_id = ?
    `).bind(me.sub).run()
    wallet.free_left = 1
  }

  const isFreeS = !activeDeposit && wallet.free_left > 0

  // ── Guard: must have free spin OR paid spin available ────────────────────
  if (!isFreeS) {
    if (!activeDeposit) return c.json({ error: 'No active deposit. Please deposit first.' }, 400)
    if (wallet.balance < SPIN_FEE) return c.json({ error: `Insufficient balance. Need $${SPIN_FEE.toFixed(2)} to spin.` }, 400)
    if (wallet.spins_left <= 0) return c.json({ error: 'No spins left today. Come back tomorrow!' }, 400)
  }

  // ── Spin ─────────────────────────────────────────────────────────────────
  const segmentIndex = weightedSpinResult()
  const segment = WHEEL_SEGMENTS[segmentIndex]
  const multiplier = segment.multiplier

  let rawEarning = 0
  let fee = 0
  let net = 0

  if (isFreeS) {
    rawEarning = multiplier > 0 ? Math.min(FREE_SPIN_BASE * multiplier * 0.02, 0.50) : 0
    fee = 0
    net = rawEarning
  } else {
    const dailyEarning = (activeDeposit.amount * activeDeposit.earning_rate) / 100
    rawEarning = multiplier > 0 ? dailyEarning * multiplier : 0
    fee = SPIN_FEE
    net = rawEarning - SPIN_FEE
  }

  const newBalance = Math.max(0, wallet.balance + net)
  const newEarned  = wallet.total_earned + Math.max(0, rawEarning)

  if (isFreeS) {
    await c.env.DB.batch([
      c.env.DB.prepare(`
        UPDATE user_wallets
        SET balance = ?, total_earned = ?, free_left = 0,
            reset_at = COALESCE(reset_at, datetime('now')),
            updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(newBalance, newEarned, me.sub),
      c.env.DB.prepare(`
        INSERT INTO spin_results (id, user_id, deposit_id, segment_index, multiplier, earning, fee, net)
        VALUES (?, ?, 'free', ?, ?, ?, 0, ?)
      `).bind(crypto.randomUUID(), me.sub, segmentIndex, multiplier, rawEarning, net),
    ])
  } else {
    await c.env.DB.batch([
      c.env.DB.prepare(`
        UPDATE user_wallets
        SET balance = ?, total_earned = ?, spins_left = spins_left - 1, updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(newBalance, newEarned, me.sub),
      c.env.DB.prepare(`
        INSERT INTO spin_results (id, user_id, deposit_id, segment_index, multiplier, earning, fee, net)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), me.sub, activeDeposit.id, segmentIndex, multiplier, rawEarning, SPIN_FEE, net),
    ])
  }

  return c.json({
    ok: true,
    isFree: isFreeS,
    segment_index: segmentIndex,
    label: segment.label,
    multiplier,
    earning: rawEarning,
    fee,
    net,
    new_balance: newBalance,
    spins_left: isFreeS ? wallet.spins_left : wallet.spins_left - 1,
    free_left: isFreeS ? 0 : wallet.free_left,
    won: multiplier > 0,
  })
})

// ─── GET /payment/payfast ─────────────────────────────────────────────────────
api.get('/payfast', authMiddleware, async (c) => {
  const me = c.get('user')
  const plan_id = c.req.query('plan_id')
  const amount  = c.req.query('amount')
  const phone   = c.req.query('phone') || ''

  if (!plan_id || !amount) {
    return c.json({ error: 'plan_id and amount are required' }, 400)
  }

  const parsedAmount = parseFloat(amount)
  const plan = await c.env.DB.prepare(
    'SELECT * FROM plans WHERE id = ? AND active = 1'
  ).bind(plan_id).first<any>()

  if (!plan || parsedAmount < plan.min_deposit || parsedAmount > plan.max_deposit) {
    return c.redirect('/user/deposit?error=Invalid+plan+or+amount')
  }

  const orderid = GenOrderId();
  const depositId = crypto.randomUUID()
  await c.env.DB.prepare(`
    INSERT INTO deposits (id, user_id, plan_id, order_id, amount)
    VALUES (?, ?, ?, ?, ?)
  `).bind(depositId, me.sub, plan_id, orderid, parsedAmount).run()

  const paymentData = {
    amount: parsedAmount,
    customer_id: me.sub,
    customer_email: me.email,
    customer_phone: phone,
    name: me.name || '',
    customer_address: '',
    description: `Deposit Plan ${plan_id} - DepositID:${depositId}`,
    order_id: orderid,
  }

  const mockRequest = new Request('https://internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  })

  const response = await payfastHandler.fetch(mockRequest, c.env as any)
  return response
})

// ─── GET /payment/result ──────────────────────────────────────
api.get('/success', HandleSuccess)
api.get('/invalid', HandleFailure)

// ─── POST /payment/handleIPN ──────────────────────────────────────
api.post('/handleIPN', async (c) => {
  const response = await handlePayFastIPN(c.req.raw, c.env as any, c.env.DB)
  return response
})

// ─── POST /api/admin/confirm-deposit (Manual admin confirm) ───────────────────
api.post('/admin/confirm-deposit', async (c) => {
  const adminKey = c.req.header('X-Admin-Key')
  if (!adminKey || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { deposit_id } = await c.req.json<{ deposit_id: string }>()
  if (!deposit_id) return c.json({ error: 'deposit_id required' }, 400)
  
  const deposit = await c.env.DB.prepare('SELECT * FROM deposits WHERE id = ?').bind(deposit_id).first<any>()
  if (!deposit) return c.json({ error: 'Deposit not found' }, 404)
  if (deposit.status !== 'pending') return c.json({ error: 'Already processed' }, 400)

  const plan = await c.env.DB.prepare('SELECT daily_spins FROM plans WHERE id = ?').bind(deposit.plan_id).first<{ daily_spins: number }>()
  const spins = plan?.daily_spins || 5

  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE deposits SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?`).bind(deposit_id),
    c.env.DB.prepare(`
      UPDATE user_wallets
      SET balance = balance + ?, total_deposited = total_deposited + ?, spins_left = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).bind(deposit.amount, deposit.amount, spins, deposit.user_id),
  ])

  return c.json({ ok: true, message: 'Deposit confirmed and wallet updated.' })
})

// ─── POST /api/admin/reset-spins (Daily cron job endpoint) ───────────────────
api.post('/admin/reset-spins', async (c) => {
  const adminKey = c.req.header('X-Admin-Key')
  if (!adminKey || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await c.env.DB.prepare(`
    UPDATE user_wallets
    SET spins_left = COALESCE(
      (SELECT p.daily_spins FROM deposits d
      JOIN plans p ON d.plan_id = p.id
      WHERE d.user_id = user_wallets.user_id AND d.status = 'confirmed'
      ORDER BY d.created_at DESC LIMIT 1),
    spins_left
    ),
    free_left = 1,
    reset_at = datetime('now'),
    updated_at = datetime('now')
  `).run()

  return c.json({ ok: true, message: 'Spins reset for all active users.' })
})

export default api
