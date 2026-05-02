import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from './types'
import { verifyJWT } from './utils/crypto'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import apiRoutes  from './routes/api'
import { homePage } from './views/home'
import { layout }   from './views/layout'

const app = new Hono<{ Bindings: Env }>()

// ─── Security headers middleware ──────────────────────────────────────────────
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
})

// ─── Landing Page ─────────────────────────────────────────────────────────────
app.get('/', async (c) => {
  // Redirect logged-in users to dashboard
  const token = getCookie(c, 'session')
  if (token) {
    const payload = await verifyJWT(token, c.env.JWT_SECRET)
    if (payload) return c.redirect('/user/dashboard')
  }
  return c.html(homePage())
})

// ─── Static / Info pages ─────────────────────────────────────────────────────
app.get('/terms', (c) => c.html(staticPage('Terms of Service', termsContent)))
app.get('/privacy', (c) => c.html(staticPage('Privacy Policy', privacyContent)))
app.get('/faq', (c) => c.html(staticPage('FAQ', faqContent)))

// ─── Route Groups ─────────────────────────────────────────────────────────────
app.route('/', authRoutes)        // /register, /login, /logout, /verify-email
app.route('/user', userRoutes)    // /user/dashboard, /user/deposit, etc.
app.route('/api',  apiRoutes)     // /api/spin
app.route('/payment', apiRoutes)  // /payment/payfast, /payment/success, /payment/notify

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.notFound((c) => {
  return c.html(layout(`
  <div class="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <div class="text-8xl mb-6 animate-float">🎰</div>
    <h1 class="font-display text-5xl font-black text-white mb-3">404</h1>
    <p class="text-gray-400 text-lg mb-8">Oops! This page spun away.</p>
    <a href="/" class="btn-gold px-8 py-3.5">Back to Home</a>
  </div>`, { title: '404 – SpinVault' }), 404)
})

// ─── Error Handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('App error:', err)
  return c.html(layout(`
  <div class="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <div class="text-8xl mb-6">💥</div>
    <h1 class="font-display text-3xl font-bold text-white mb-3">Something went wrong</h1>
    <p class="text-gray-400 mb-8">We hit an unexpected error. Please try again.</p>
    <a href="/" class="btn-gold px-8 py-3.5">Go Home</a>
  </div>`, { title: 'Error – SpinVault' }), 500)
})

// ─── Static Page Helper ───────────────────────────────────────────────────────
function staticPage(title: string, content: string): string {
  return layout(`
  <div class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="font-display text-3xl font-bold text-white mb-2">${title}</h1>
    <p class="text-gray-500 text-sm mb-8">Last updated: January 2025</p>
    <div class="card p-8 prose prose-invert prose-sm max-w-none
      [&_h2]:font-display [&_h2]:text-white [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
      [&_p]:text-gray-400 [&_p]:leading-relaxed [&_p]:mb-4
      [&_ul]:text-gray-400 [&_ul]:space-y-1 [&_li]:leading-relaxed">
      ${content}
    </div>
  </div>`, { title: `${title} – SpinVault` })
}

// ─── Static Content ───────────────────────────────────────────────────────────
const termsContent = `
<h2>1. Acceptance of Terms</h2>
<p>By accessing and using SpinVault, you accept and agree to be bound by these Terms of Service. You must be at least 18 years old to use this platform.</p>
<h2>2. Platform Description</h2>
<p>SpinVault is an online entertainment platform where users can spin a virtual wheel for a chance to win monetary rewards based on their investment plan.</p>
<h2>3. Deposits and Withdrawals</h2>
<p>Deposits are used to fund your account and unlock daily spins. Withdrawals are processed within 1–3 business days to your registered bank account. SpinVault reserves the right to verify identity before processing withdrawals.</p>
<h2>4. Spin Fee</h2>
<p>Each spin costs $0.50, deducted from your balance. This fee is non-refundable regardless of the spin outcome.</p>
<h2>5. No Guarantee of Returns</h2>
<p>Spinning outcomes are determined by a weighted random algorithm. There is no guarantee of any specific outcome or profit. Past performance does not indicate future results.</p>
<h2>6. Responsible Gaming</h2>
<p>SpinVault encourages responsible gaming. Never deposit more than you can afford to lose. If you believe you have a gambling problem, please seek professional help.</p>
<h2>7. Account Termination</h2>
<p>SpinVault reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or attempt to manipulate the platform.</p>`

const privacyContent = `
<h2>Information We Collect</h2>
<p>We collect information you provide during registration (name, email), payment information, and usage data including spin history and transaction records.</p>
<h2>How We Use Your Information</h2>
<p>We use your information to provide and improve our services, process payments and withdrawals, send important account notifications, and comply with legal obligations.</p>
<h2>Data Security</h2>
<p>Your data is encrypted in transit and at rest. Passwords are hashed using PBKDF2 with SHA-256. We never store plain-text passwords or full payment card details.</p>
<h2>Data Retention</h2>
<p>We retain your account data for the duration of your account and up to 7 years after account closure for legal and financial compliance purposes.</p>
<h2>Your Rights</h2>
<p>You have the right to access, correct, or delete your personal data. Contact us to exercise these rights.</p>
<h2>Contact</h2>
<p>For privacy concerns, contact us at privacy@SpinVault.app</p>`

const faqContent = `
<h2>How do I start earning?</h2>
<p>Register an account, verify your email, set up your bank details, choose an investment plan and deposit, then use your daily spins on the dashboard to earn rewards.</p>
<h2>What does each spin cost?</h2>
<p>Each spin costs $0.50, deducted from your wallet balance. Make sure you maintain a positive balance to keep spinning.</p>
<h2>How are spin outcomes determined?</h2>
<p>Outcomes are determined by a weighted random algorithm. Different segments have different probabilities. The wheel contains segments ranging from 0x (no win) to 10x multipliers.</p>
<h2>How long do withdrawals take?</h2>
<p>Withdrawal requests are typically processed within 1–3 business days. Your funds are sent directly to your registered bank account.</p>
<h2>Can I change my bank details?</h2>
<p>Yes, you can update your bank details at any time from the Bank Details page. Changes may require re-verification for security.</p>
<h2>What happens to my deposit?</h2>
<p>Your deposit is credited to your wallet balance. The plan you choose determines your daily spin allowance and earning rate multiplier.</p>
<h2>Is there a referral program?</h2>
<p>Yes! Share your unique invite code with friends. When they register and deposit, both of you benefit from our referral bonuses.</p>`

export default app
