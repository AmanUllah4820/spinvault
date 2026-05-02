export const SECURE_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Idempotency-Key, X-Request-ID',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Access-Control-Allow-Origin': 'https://spinvault.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Request-ID': '<uuid-v4>',
  'X-API-Version': 'v1',
  'X-Frame-Options': 'DENY',
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '<dynamic>',
  'X-RateLimit-Reset': '<timestamp>',

  // Add these backend security headers
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Simple JSON headers for public/unprotected endpoints
export const SIMPLE_JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

export const HTML_HEADERS =  {
  'Content-Type': 'text/html; charset=UTF-8',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
};

// Public JSON response (no CORS, no HSTS, etc.)
export function json(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...SIMPLE_JSON_HEADERS, ...extraHeaders },
  });
}

// Banking cookie configuration
export interface BankingCookieConfig {
  accessToken: { maxAge: number; path: string; };
  refreshToken: { maxAge: number; path: string; };
  csrf: { maxAge: number; path: string; };
}

export const BANKING_COOKIE_CONFIG: BankingCookieConfig = {
  accessToken: { maxAge: 900, path: '/' },           // 15 minutes
  refreshToken: { maxAge: 604800, path: '/api/auth/refresh' }, // 7 days
  csrf: { maxAge: 900, path: '/' }                   // 15 minutes
};

// Set banking-grade secure cookies
export function setBankingCookies(
  accessToken: string, 
  refreshToken: string, 
  csrfToken: string
): string[] {
  const cookies: string[] = [];
  
  cookies.push(
    `__Host-access_token=${accessToken}; ` +
    `HttpOnly; ` +
    `Secure; ` +
    `SameSite=Strict; ` +
    `Path=${BANKING_COOKIE_CONFIG.accessToken.path}; ` +
    `Max-Age=${BANKING_COOKIE_CONFIG.accessToken.maxAge}; ` +
    `Priority=High`
  );

  cookies.push(
    `__Host-refresh_token=${refreshToken}; ` +
    `HttpOnly; ` +
    `Secure; ` +
    `SameSite=Strict; ` +
    `Path=${BANKING_COOKIE_CONFIG.refreshToken.path}; ` +
    `Max-Age=${BANKING_COOKIE_CONFIG.refreshToken.maxAge}; ` +
    `Priority=High`
  );

  cookies.push(
    `csrf_token=${csrfToken}; ` +
    `Secure; ` +
    `SameSite=Strict; ` +
    `Path=${BANKING_COOKIE_CONFIG.csrf.path}; ` +
    `Max-Age=${BANKING_COOKIE_CONFIG.csrf.maxAge}; ` +
    `Priority=High`
  );

  return cookies;
}

// Clear all banking cookies
export function clearBankingCookies(): string[] {
  return [
    `__Host-access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    `__Host-refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=0`,
    `csrf_token=; Secure; SameSite=Strict; Path=/; Max-Age=0`
  ];
}

export function secureJsonResponse(
  data: any, 
  status: number, 
  cookies: string[],
  env: { ENVIRONMENT?: string }
): Response {
  const isProduction = env.ENVIRONMENT === 'production';
  
  const headers: Record<string, string> = {
    ...SECURE_HEADERS as Record<string, string>,
    'Set-Cookie': cookies.join('; '),
  };

  // Add CSP only in production
  if (isProduction) {
    headers['Content-Security-Policy'] = 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdn.finxapay.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://api.finxapay.com";
  }
  
  return new Response(JSON.stringify(data), { status, headers });
}

// Parse cookies helper
export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function GenOrderId(): string {
  const timestamp = Date.now().toString(36).padStart(6, '0');
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `FXP-${timestamp}-${random}`;
}

export function generateTrxId(): string {
  const timestamp = Date.now().toString(36).padStart(6, '0');
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `SV-${timestamp}-${random}`;
}

export function generateTxnId(): string {
  const num = Math.floor(10000 + Math.random() * 90000)
  return `TXN-${num}`
}
