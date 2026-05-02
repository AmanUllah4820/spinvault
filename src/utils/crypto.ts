import type { JWTPayload } from '../types'

// ─── Password Hashing ────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  const hashArray = new Uint8Array(derivedBits)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = stored.split(':')
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    )
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    )
    const hashArray = new Uint8Array(derivedBits)
    const newHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
    return newHashHex === hashHex
  } catch {
    return false
  }
}

// ─── JWT ─────────────────────────────────────────────────────────────────────
function base64urlEncode(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
function base64urlDecode(data: string): string {
  return atob(data.replace(/-/g, '+').replace(/_/g, '/'))
}

export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresInHours = 168): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = { ...payload, iat: now, exp: now + expiresInHours * 3600 }
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = base64urlEncode(JSON.stringify(fullPayload))
  const enc    = new TextEncoder()
  const key    = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig    = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))
  const sigB64 = base64urlEncode(String.fromCharCode(...new Uint8Array(sig)))
  return `${header}.${body}.${sigB64}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) return null
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigBytes = Uint8Array.from(base64urlDecode(signature), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(`${header}.${body}`))
    if (!valid) return null
    const payload: JWTPayload = JSON.parse(base64urlDecode(body))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// ─── OTP ─────────────────────────────────────────────────────────────────────
export function generateOTP(length = 6): string {
  const digits = '0123456789'
  let otp = ''
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  for (const byte of bytes) otp += digits[byte % digits.length]
  return otp
}

// ─── Invitation Code ──────────────────────────────────────────────────────────
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(randomBytes[i] % chars.length);
  }
  return result;
}

// ─── Random weighted spin ─────────────────────────────────────────────────────
// Segments: [multiplier, weight]
// House edge: ~70% lose, 30% win overall
export const WHEEL_SEGMENTS = [
  { label: '0x',    multiplier: 0,    weight: 28, color: '#ef4444' },
  { label: '0.5x',  multiplier: 0.5,  weight: 20, color: '#f97316' },
  { label: '0x',    multiplier: 0,    weight: 20, color: '#ef4444' },
  { label: '1x',    multiplier: 1,    weight: 12, color: '#22c55e' },
  { label: '0x',    multiplier: 0,    weight: 8,  color: '#ef4444' },
  { label: '1.5x',  multiplier: 1.5,  weight: 5,  color: '#3b82f6' },
  { label: '0x',    multiplier: 0,    weight: 4,  color: '#ef4444' },
  { label: '2x',    multiplier: 2,    weight: 2,  color: '#a855f7' },
  { label: '0x',    multiplier: 0,    weight: 0.5,color: '#ef4444' },
  { label: '5x',    multiplier: 5,    weight: 0.3,color: '#f59e0b' },
  { label: '0x',    multiplier: 0,    weight: 0.1,color: '#ef4444' },
  { label: '10x',   multiplier: 10,   weight: 0.1,color: '#ec4899' },
]

export function weightedSpinResult(): number {
  const total = WHEEL_SEGMENTS.reduce((s, seg) => s + seg.weight, 0)
  let rand = Math.random() * total
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    rand -= WHEEL_SEGMENTS[i].weight
    if (rand <= 0) return i
  }
  return 0
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
