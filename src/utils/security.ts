/* ================= security.fast.ts ================= */
import { parseCookies, timingSafeEqual, SECURE_HEADERS } from './shared';
import type { Env } from '../types'

/* ───────────────────────────────────────────────
   UTILITY FUNCTIONS
─────────────────────────────────────────────── */
function concatUint8(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

// Helper: convert Uint8Array to a plain ArrayBuffer so crypto.subtle accepts it
// under strict @cloudflare/workers-types which requires ArrayBuffer not ArrayBufferLike
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

async function sha256Hex(message: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(message) as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ───────────────────────────────────────────────
   IN-MEMORY CACHE FOR PERFORMANCE
─────────────────────────────────────────────── */
const hkdfCache = new Map<string, Uint8Array>();
const cryptoKeyCache = new Map<string, CryptoKey>();
const rateCache = new Map<string, number>();
const hmacKeyCache = new Map<string, CryptoKey>();

/* ───────────────────────────────────────────────
   RATE LIMITING (1 request / 3s per merchant)
─────────────────────────────────────────────── */
export function checkRateLimit(merchantId: string): boolean {
  if (!merchantId) return false;

  const now = Date.now();
  const last = rateCache.get(merchantId) || 0;

  if (now - last < 3000) return false;

  rateCache.set(merchantId, now);
  return true;
}


/* ───────────────────────────────────────────────
   SESSION MANAGEMENT
─────────────────────────────────────────────── */
export async function saveSession(
  sessionId: string,
  data: Record<string, any>,
  env: Env,
  ttl = 3600
) {
  await env.KV_SESSIONS.put(sessionId, JSON.stringify(data), { expirationTtl: ttl });
}

export async function getSession(sessionId: string, env: Env): Promise<Record<string, any> | null> {
  const raw = await env.KV_SESSIONS.get(sessionId);
  return raw ? JSON.parse(raw) : null;
}

/* ───────────────────────────────────────────────
   HKDF (optimized, cached)
─────────────────────────────────────────────── */
async function hkdf(key: string, length = 32, info = 'encryption', salt = 'tx2p0b5f1mztqpv9tc5ipq2mz6fi84bcpfuqsyxpr6'): Promise<Uint8Array> {
  const cacheKey = `${key}|${salt}|${info}|${length}`;
  if (hkdfCache.has(cacheKey)) return hkdfCache.get(cacheKey)!;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(encoder.encode(key)),   // ✅ cast Uint8Array → ArrayBuffer
    'HKDF',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(encoder.encode(salt)),   // ✅ cast
      info: toArrayBuffer(encoder.encode(info)),   // ✅ cast
    },
    cryptoKey,
    length * 8
  );

  const result = new Uint8Array(derivedBits);
  hkdfCache.set(cacheKey, result);
  return result;
}

/* ───────────────────────────────────────────────
   AES-256-GCM ENCRYPT / DECRYPT (optimized)
─────────────────────────────────────────────── */
export async function encryptData(
  data: Record<string, any>,
  key: string,
  salt = 'tx2p0b5f1mztqpv9tc5ipq2mz6fi84bcpfuqsyxpr6'
): Promise<string> {
  data._ts = Math.floor(Date.now() / 1000);
  data._nonce = bytesToBase64(crypto.getRandomValues(new Uint8Array(8)));

  const json = JSON.stringify(data);
  if (!json) throw new Error('JSON encoding failed');

  const derivedKey = await hkdf(key, 32, 'encryption', salt);
  const cacheKey = key + salt;
  let cryptoKey: CryptoKey;
  if (cryptoKeyCache.has(cacheKey)) {
    cryptoKey = cryptoKeyCache.get(cacheKey)!;
  } else {
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(derivedKey),   // ✅ cast Uint8Array → ArrayBuffer
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    cryptoKeyCache.set(cacheKey, cryptoKey);
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },   // ✅ cast
    cryptoKey,
    toArrayBuffer(encoder.encode(json))            // ✅ cast
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
  const tag = encryptedArray.slice(encryptedArray.length - 16);
  const result = concatUint8(iv, concatUint8(ciphertext, tag));

  return bytesToBase64(result);
}

export async function decryptData(
  token: string,
  key: string,
  ttl = 300,
  salt = 'tx2p0b5f1mztqpv9tc5ipq2mz6fi84bcpfuqsyxpr6'
): Promise<Record<string, any> | null> {
  try {
    const data = base64ToBytes(token);
    if (data.length < 28) return null;

    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12, data.length - 16);
    const tag = data.slice(data.length - 16);

    const derivedKey = await hkdf(key, 32, 'encryption', salt);
    const cacheKey = key + salt;
    let cryptoKey: CryptoKey;
    if (cryptoKeyCache.has(cacheKey)) {
      cryptoKey = cryptoKeyCache.get(cacheKey)!;
    } else {
      cryptoKey = await crypto.subtle.importKey(
        'raw',
        toArrayBuffer(derivedKey),   // ✅ cast Uint8Array → ArrayBuffer
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      cryptoKeyCache.set(cacheKey, cryptoKey);
    }

    const combined = concatUint8(ciphertext, tag);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },   // ✅ cast
      cryptoKey,
      toArrayBuffer(combined)                         // ✅ cast
    );

    const parsed = JSON.parse(decoder.decode(decryptedBuffer));
    const now = Math.floor(Date.now() / 1000);

    if (!parsed._ts || now - parsed._ts > ttl) return null;

    delete parsed._ts;
    delete parsed._nonce;
    return parsed;
  } catch {
    return null;
  }
}

/* ───────────────────────────────────────────────
   HMAC-SHA256 (FOR CSRF)
─────────────────────────────────────────────── */
export async function hmacSHA256(message: string, secret: string) {
  let key = hmacKeyCache.get(secret);

  if (!key) {
    key = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(encoder.encode(secret)),   // ✅ cast
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    hmacKeyCache.set(secret, key);
  }

  const sig = await crypto.subtle.sign('HMAC', key, toArrayBuffer(encoder.encode(message)));  // ✅ cast

  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256(message: string) {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', toArrayBuffer(data));  // ✅ cast
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2,'0'))
    .join('');
}

export async function validateCSRF(request: Request, env: Env): Promise<Response | null> {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }
  
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const cookieCsrfToken = cookies.csrf_token;
  const headerCsrfToken = request.headers.get('X-CSRF-Token');
  
  if (!cookieCsrfToken || !headerCsrfToken || !timingSafeEqual(headerCsrfToken, cookieCsrfToken)) {
    return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
      status: 403,
      headers: SECURE_HEADERS
    });
  }
  
  return null;
}
