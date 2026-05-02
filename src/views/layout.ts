function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface LayoutOptions {
  title?: string
  description?: string
  bodyClass?: string
  activePage?: string
  userName?: string
  userBalance?: number
  flashMessage?: { type: 'success' | 'error' | 'info' | 'warning'; text: string }
  noNav?: boolean
  scripts?: string
}

export function layout(content: string, opts: LayoutOptions = {}): string {
  const {
    title = 'SpinVault – Play & Earn Real Money',
    description = 'Spin the wheel, win real money. The premier online spin-and-win platform.',
    activePage = '',
    userName,
    userBalance,
    flashMessage,
    noNav = false,
    scripts = '',
  } = opts

  const isLoggedIn = !!userName

  const desktopNav = isLoggedIn ? `
    <nav class="hidden md:flex items-center gap-1">
      <a href="/user/dashboard" class="nav-link ${activePage==='dashboard'?'active':''}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Dashboard
      </a>
      <a href="/user/deposit" class="nav-link ${activePage==='deposit'?'active':''}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Deposit
      </a>
      <a href="/user/withdraw" class="nav-link ${activePage==='withdraw'?'active':''}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        Withdraw
      </a>
      <a href="/user/referrals" class="nav-link ${activePage==='referrals'?'active':''}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Referrals
      </a>
    </nav>
    <div class="hidden md:flex items-center gap-4">
      ${userBalance !== undefined ? `
      <div class="flex items-center gap-2 px-4 py-2 bg-dark-300/60 border border-white/10 rounded-xl">
        <svg class="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span class="text-gold-400 font-semibold text-sm">$${userBalance!.toFixed(2)}</span>
      </div>` : ''}
      <div class="relative group">
        <button class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-400 font-bold text-sm">
            ${userName ? esc(userName)[0].toUpperCase() : 'U'}
          </div>
          <span class="text-sm text-gray-300 font-medium hidden md:block">${userName ? esc(userName) : 'User'}</span>
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="absolute right-0 top-full mt-2 w-48 bg-dark-100 border border-white/10 rounded-xl shadow-2xl shadow-black/40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <a href="/user/profile" class="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-gold-400 hover:bg-white/5 rounded-t-xl transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Profile Settings
          </a>
          <a href="/user/WithdrawDetails" class="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-gold-400 hover:bg-white/5 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            Bank Details
          </a>
          <hr class="border-white/5 mx-2">
          <a href="/logout" class="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-b-xl transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sign Out
          </a>
        </div>
      </div>
    </div>` : `
    <div class="flex items-center gap-3">
      <a href="/login" class="btn-outline py-2 px-5 text-sm">Sign In</a>
      <a href="/register" class="btn-gold py-2 px-5 text-sm">Get Started</a>
    </div>`

  const mobileNav = isLoggedIn ? `
  <div class="mobile-nav md:hidden">
    <a href="/user/dashboard" class="mobile-nav-item ${activePage==='dashboard'?'active':''}">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
      <span>Home</span>
    </a>
    <a href="/user/deposit" class="mobile-nav-item ${activePage==='deposit'?'active':''}">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      <span>Deposit</span>
    </a>
    <a href="/user/dashboard#spin" class="mobile-nav-item ${activePage==='spin'?'active':''}">
      <div class="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center -mt-4 shadow-lg shadow-gold-500/40">
        <span class="text-xl">🎰</span>
      </div>
      <span>Spin</span>
    </a>
    <a href="/user/withdraw" class="mobile-nav-item ${activePage==='withdraw'?'active':''}">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      <span>Withdraw</span>
    </a>
    <a href="/user/referrals" class="mobile-nav-item ${activePage==='referrals'?'active':''}">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      <span>Refer</span>
    </a>
  </div>` : ''

  const flash = flashMessage ? `
  <div class="alert alert-${flashMessage.type} animate-slide-up mx-4 md:mx-0 mt-4" id="flash-msg">
    <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      ${flashMessage.type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' :
        flashMessage.type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>' :
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
    </svg>
    <span>${flashMessage.text}</span>
    <button onclick="this.parentElement.remove()" class="ml-auto opacity-60 hover:opacity-100 transition-opacity">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  </div>` : ''

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="robots" content="index,follow">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
  <link rel="canonical" href="${opts.noNav ? '' : ''}">
</head>
<body class="min-h-screen ${isLoggedIn ? 'pb-20 md:pb-0' : ''}">
  <!-- Background Effects -->
  <div class="fixed inset-0 bg-mesh pointer-events-none"></div>
  <div class="fixed top-0 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
  <div class="fixed bottom-1/4 right-1/4 w-64 h-64 bg-gold-600/5 rounded-full blur-3xl pointer-events-none"></div>

  ${noNav ? '' : `
  <!-- Header -->
  <header class="sticky top-0 z-40 bg-dark-400/80 backdrop-blur-md border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
      <!-- Logo -->
      <a href="${isLoggedIn ? '/user/dashboard' : '/'}" class="flex items-center gap-2.5 flex-shrink-0">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30 text-xl">🎰</div>
        <span class="font-display font-bold text-lg text-white hidden sm:block">Spin<span class="text-gradient">Vault</span></span>
      </a>
      ${desktopNav}
    </div>
  </header>`}

  <!-- Flash Message -->
  ${flash}

  <!-- Main Content -->
  <main class="relative z-10">
    ${content}
  </main>

  <!-- Mobile Nav -->
  ${mobileNav}

  <!-- Base Scripts -->
  <script>
    // Auto-dismiss flash messages
    setTimeout(() => {
      const flash = document.getElementById('flash-msg')
      if (flash) flash.style.opacity = '0', setTimeout(() => flash.remove(), 300)
    }, 5000)
  </script>
  ${scripts}
</body>
</html>`
}

// ─── Auth Layout (centered, no nav) ──────────────────────────────────────────
export function authLayout(content: string, opts: LayoutOptions = {}): string {
  return layout(`
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
    <a href="/" class="flex items-center gap-3 mb-8 group">
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30 text-2xl group-hover:scale-105 transition-transform">🎰</div>
      <span class="font-display font-bold text-2xl text-white">Spin<span class="text-gradient">Win</span></span>
    </a>
    <div class="w-full max-w-md">
      ${content}
    </div>
    <p class="mt-8 text-xs text-gray-600">
      &copy; ${new Date().getFullYear()} SpinVault. All rights reserved. 
      <a href="/privacy" class="text-gray-500 hover:text-gold-400 transition-colors">Privacy</a> · 
      <a href="/terms" class="text-gray-500 hover:text-gold-400 transition-colors">Terms</a>
    </p>
  </div>`, { ...opts, noNav: true })
}
