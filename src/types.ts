export interface Env {
  DB: D1Database
  JWT_SECRET: string
  BREVO_API_KEY: string
  BREVO_FROM_EMAIL: string
  BREVO_FROM_NAME: string
  APP_URL: string
  KV_SESSIONS: KVNamespace;
  CSRF_SECRET_KEY: string;
  ENCRYPTION_KEY: string;
  PAYFAST_MERCHANT_ID: string;
  PAYFAST_STORE_ID: string;
  PAYFAST_SECURED_KEY: string;
  PayFast_BASE_URL: string;
  SPIN_FEE: string
  ADMIN_KEY: string
}

export interface User {
  id: string
  full_name: string
  email: string
  password_hash: string
  invitation_code: string
  invited_by: string | null
  email_verified: number
  profile_complete: number
  created_at: string
}

export interface WithdrawDetail {
  user_id: number
  bank_country: string
  bank_name: string
  account_holder_name: string
  account_number: string
  routing_number: string | null
  swift_code: string | null
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  min_deposit: number
  max_deposit: number
  earning_rate: number
  daily_spins: number
  badge: string
  color: string
  popular: number
}

export interface Deposit {
  id: string
  user_id: string
  plan_id: string
  amount: number
  status: 'pending' | 'confirmed' | 'rejected'
  payment_method: string
  transaction_ref: string | null
  payment_proof: string | null
  created_at: string
}

export interface UserWallet {
  user_id: string
  balance: number
  total_deposited: number
  total_earned: number
  total_withdrawn: number
  spins_left: number
  free_left: number
  reset_at: string
  updated_at: string
}

export interface SpinResult {
  id: string
  user_id: string
  deposit_id: string
  segment_index: number
  multiplier: number
  earning: number
  fee: number
  net: number
  created_at: string
}

export interface JWTPayload {
  sub: string
  email: string
  name: string
  verified: boolean
  iat: number
  exp: number
}

export interface PlanWithDetails extends Plan {
  user_deposit?: number
}

export interface DashboardData {
  user: User
  wallet: UserWallet
  activeDeposit: Deposit & { plan_name: string; earning_rate: number } | null
  recentSpins: SpinResult[]
  totalSpinsToday: number
}
