# 🎰 SpinVault — Cloudflare Pages Spin & Win Platform

A full-stack **Spin & Win** game built on **Cloudflare Pages + D1 + Hono**, with server-side rendering in TypeScript and Tailwind CSS.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Hosting     | Cloudflare Pages                  |
| Functions   | Cloudflare Pages Functions (Edge) |
| Database    | Cloudflare D1 (SQLite)            |
| Backend     | Hono v4 (TypeScript)              |
| Styling     | Tailwind CSS v3                   |
| Auth        | PBKDF2 passwords + custom JWT     |
| Email       | Brevo (Sendinblue) API            |
| Payments    | PayFast + Manual Bank Transfer    |

---

## Project Structure

```
spin-win-app/
├── functions/
│   └── [[path]].ts          # Cloudflare Pages catch-all function
├── migrations/
│   ├── 0001_schema.sql      # D1 database schema
│   └── 0002_seed.sql        # Initial plans seed data
├── public/
│   ├── css/styles.css       # Generated Tailwind CSS
│   ├── images/favicon.svg
│   ├── _headers             # CF Pages headers
│   └── _redirects           # CF Pages redirects
├── src/
│   ├── index.ts             # Main Hono app
│   ├── types.ts             # TypeScript interfaces
│   ├── input.css            # Tailwind source CSS
│   ├── middleware/
│   │   └── auth.ts          # JWT auth middleware
│   ├── routes/
│   │   ├── auth.ts          # Register/Login/Verify
│   │   ├── user.ts          # Dashboard/Deposit/Withdraw
│   │   └── api.ts           # Spin API + PayFast
│   ├── utils/
│   │   ├── crypto.ts        # JWT, PBKDF2, OTP, Spin logic
│   │   └── email.ts         # Brevo email sender
│   └── views/
│       ├── layout.ts        # HTML layout shell
│       ├── home.ts          # Landing page
│       ├── auth/index.ts    # Register/Login/Verify views
│       └── user/
│           ├── dashboard.ts     # Dashboard + Spin Wheel
│           ├── deposit.ts       # Plans + Payment
│           ├── withdraw-details.ts # Bank details form
│           ├── withdraw.ts      # Withdraw funds
│           └── referrals.ts     # Referral program
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── wrangler.toml
```

---

## Setup Guide

### 1. Prerequisites

```bash
npm install -g wrangler
npm install
```

### 2. Create D1 Database

```bash
wrangler d1 create spin-win-db
```

Copy the `database_id` output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "spin-win-db"
database_id = "YOUR_DATABASE_ID_HERE"   # ← paste here
```

### 3. Run Migrations

```bash
# Local development
npm run db:migrate:local
npm run db:seed:local

# Production
npm run db:migrate
npm run db:seed
```

### 4. Configure Environment Variables

Edit `wrangler.toml` and replace the placeholder values:

```toml
[vars]
JWT_SECRET = "your-super-secret-jwt-key-min-32-chars"
BREVO_API_KEY = "xkeysib-your-brevo-api-key"
BREVO_FROM_EMAIL = "noreply@yourdomain.com"
BREVO_FROM_NAME = "SpinVault"
APP_URL = "https://your-app.pages.dev"
PAYFAST_MERCHANT_ID = "your-payfast-merchant-id"
PAYFAST_MERCHANT_KEY = "your-payfast-merchant-key"
PAYFAST_PASSPHRASE = "your-payfast-passphrase"
PAYFAST_SANDBOX = "true"   # set to "false" for production
SPIN_FEE = "0.50"
```

For production secrets, use Wrangler secrets instead:

```bash
wrangler pages secret put JWT_SECRET
wrangler pages secret put BREVO_API_KEY
wrangler pages secret put PAYFAST_MERCHANT_KEY
wrangler pages secret put PAYFAST_PASSPHRASE
```

### 5. Build CSS

```bash
npm run build:tailwind
```

### 6. Local Development

```bash
npm run dev
```

Visit `http://localhost:8788`

### 7. Deploy to Cloudflare Pages

#### Option A — Wrangler CLI
```bash
npm run build
wrangler pages deploy public
```

#### Option B — Git Integration (Recommended)
1. Push this repo to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create project
3. Connect your GitHub repository
4. Set build settings:
   - **Build command:** `npm run build:tailwind`
   - **Build output directory:** `public`
5. Add all environment variables in the Pages dashboard
6. Deploy!

---

## Features

### User Flow
```
Register → Verify Email (OTP) → Bank Details → Deposit & Choose Plan → Dashboard → Spin → Withdraw
```

### Spin Wheel Algorithm
- **12 segments** with weighted random selection
- **House edge ~70%**: majority of spins result in no win
- **Multipliers**: 0x (lose), 0.5x, 1x, 1.5x, 2x, 5x, 10x
- **Spin fee**: $0.50 per spin deducted from balance
- **Earning formula**: `deposit × earning_rate% × multiplier`

### Investment Plans
| Plan    | Deposit     | Daily Rate | Spins/Day |
|---------|-------------|------------|-----------|
| Starter | $5–$9.99    | 1.5%       | 5         |
| Basic   | $10–$49.99  | 2.0%       | 10         |
| Silver  | $50–$99.99  | 2.5%       | 20         |
| Gold    | $100–$249.99| 3.0%       | 40        |
| Premium | $250–$500   | 4.0%       | 50        |

### Daily Spin Reset
Reset spins daily via a cron job or scheduled worker. Call:
```
POST /api/admin/reset-spins
X-Admin-Key: CHANGE_THIS_ADMIN_KEY
```

Set up a Cloudflare Cron Trigger or external cron service to call this daily at midnight UTC.

### Manual Deposit Confirmation
For manual bank transfers, admin confirms via:
```
POST /api/admin/confirm-deposit
X-Admin-Key: CHANGE_THIS_ADMIN_KEY
Content-Type: application/json

{"deposit_id": 123}
```

---

## Security Features

- PBKDF2-SHA256 password hashing (100,000 iterations)
- HTTP-only secure session cookies
- Custom JWT with HMAC-SHA256
- Email OTP verification (15-minute expiry)
- CSRF protection via SameSite cookies
- Security headers (X-Frame-Options, X-Content-Type-Options)
- Input validation on all forms
- SQL injection prevention via D1 prepared statements

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | — | Landing page |
| `/register` | GET/POST | — | User registration |
| `/login` | GET/POST | — | User login |
| `/logout` | GET | — | Clear session |
| `/verify-email` | GET/POST | — | Email OTP verification |
| `/resend-otp` | POST | — | Resend OTP code |
| `/user/dashboard` | GET | ✓ | Main dashboard + wheel |
| `/user/WithdrawDetails` | GET/POST | ✓ | Bank details form |
| `/user/deposit` | GET/POST | ✓ | Plans + deposit |
| `/user/withdraw` | GET/POST | ✓ | Withdrawal request |
| `/user/referrals` | GET | ✓ | Referral program |
| `/user/profile` | GET | ✓ | User profile |
| `/api/spin` | POST | ✓ | Execute spin |
| `/payment/payfast` | GET | ✓ | PayFast redirect |
| `/payment/success` | GET | — | Payment success page |
| `/payment/notify` | POST | — | PayFast ITN webhook |
| `/api/admin/confirm-deposit` | POST | Admin | Confirm manual deposit |
| `/api/admin/reset-spins` | POST | Admin | Reset daily spins |

---

## Customization

### Change Spin Odds
Edit `WHEEL_SEGMENTS` in `src/utils/crypto.ts`. Higher weight = more likely.

### Add Payment Methods
Add new payment flows in `src/routes/api.ts` and update the deposit view in `src/views/user/deposit.ts`.

### Modify Plans
Run a SQL update against D1:
```sql
UPDATE plans SET earning_rate = 3.5 WHERE name = 'Gold';
```

---

## License
MIT — Use freely. Build responsibly. 🎰
