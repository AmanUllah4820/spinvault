-- SpinWin App - D1 Database Schema
-- Migration: 0001_schema.sql

-- Users table
CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  invitation_code TEXT NOT NULL UNIQUE,
  invited_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  email_verified  INTEGER NOT NULL DEFAULT 0,
  profile_complete INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_invitation_code ON users(invitation_code);

-- OTP verification codes
CREATE TABLE otp_codes (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  code       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'email_verify',
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);

-- Withdrawal details
CREATE TABLE withdraw_details (
  user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bank_country         TEXT NOT NULL,
  bank_name            TEXT NOT NULL,
  account_holder_name  TEXT NOT NULL,
  account_number       TEXT NOT NULL,
  routing_number       TEXT,
  swift_code           TEXT,
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Plans
CREATE TABLE plans (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  min_deposit  REAL NOT NULL,
  max_deposit  REAL NOT NULL,
  earning_rate REAL NOT NULL,
  daily_spins  INTEGER NOT NULL DEFAULT 5,
  free_spins   INTEGER NOT NULL DEFAULT 1,
  badge        TEXT NOT NULL DEFAULT 'Basic',
  color        TEXT NOT NULL DEFAULT 'gray',
  popular      INTEGER NOT NULL DEFAULT 0,
  active       INTEGER NOT NULL DEFAULT 1
);

-- Deposits
CREATE TABLE deposits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    order_id VARCHAR(255),
    transaction_ref VARCHAR(255),
    amount DECIMAL(19,4) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

-- User wallets
CREATE TABLE user_wallets (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance          REAL NOT NULL DEFAULT 0,
  total_deposited  REAL NOT NULL DEFAULT 0,
  total_earned     REAL NOT NULL DEFAULT 0,
  total_withdrawn  REAL NOT NULL DEFAULT 0,
  spins_left       INTEGER NOT NULL DEFAULT 0,
  free_left       INTEGER NOT NULL DEFAULT 1,
  reset_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Spin results
CREATE TABLE spin_results (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deposit_id    TEXT NOT NULL,
  segment_index INTEGER NOT NULL,
  multiplier    REAL NOT NULL,
  earning       REAL NOT NULL,
  fee           REAL NOT NULL DEFAULT 0.50,
  net           REAL NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_spins_user ON spin_results(user_id);
CREATE INDEX IF NOT EXISTS idx_spins_created ON spin_results(created_at);

-- Withdrawal requests
CREATE TABLE withdrawal_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  txn_id      TEXT NOT NULL UNIQUE,
  amount      REAL NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT 'bank_transfer',
  note        TEXT,
  timezone     TEXT DEFAULT 'UTC',
  processed_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id);

-- Referral tracking
CREATE TABLE referrals (
  id           TEXT PRIMARY KEY,
  referrer_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_paid   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
