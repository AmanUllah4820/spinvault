import { authLayout } from '../layout'

// ─── Register Page ────────────────────────────────────────────────────────────
export function registerPage(opts: {
  error?: string
  success?: string
  inviteCode?: string
  values?: Record<string, string>
}): string {
  const { error, success, inviteCode = '', values = {} } = opts
  return authLayout(`
  <div class="card p-8 animate-slide-up">
    <div class="text-center mb-8">
      <h1 class="font-display text-2xl font-bold text-white mb-2">Create Account</h1>
      <p class="text-gray-400 text-sm">Join thousands of winners spinning daily</p>
    </div>

    ${error ? `<div class="alert alert-error mb-6"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${error}</div>` : ''}
    ${success ? `<div class="alert alert-success mb-6"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${success}</div>` : ''}

    <form method="POST" action="/register" class="space-y-4" id="reg-form">
      <div>
        <label class="label">Full Name</label>
        <input type="text" name="full_name" value="${values.full_name || ''}" required placeholder="John Doe"
          class="input-field" autocomplete="name">
      </div>
      <div>
        <label class="label">Email Address</label>
        <input type="email" name="email" value="${values.email || ''}" required placeholder="john@example.com"
          class="input-field" autocomplete="email">
      </div>
      <div>
        <label class="label">Password</label>
        <div class="relative">
          <input type="password" name="password" required placeholder="Min 8 characters" minlength="8"
            class="input-field pr-12" id="password" autocomplete="new-password">
          <button type="button" onclick="togglePass('password','eyeP')" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-400 transition-colors">
            <svg id="eyeP" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </div>
        <div class="mt-2 flex gap-1" id="pw-strength">
          <div class="h-1 flex-1 rounded-full bg-dark-300 transition-all" id="s1"></div>
          <div class="h-1 flex-1 rounded-full bg-dark-300 transition-all" id="s2"></div>
          <div class="h-1 flex-1 rounded-full bg-dark-300 transition-all" id="s3"></div>
          <div class="h-1 flex-1 rounded-full bg-dark-300 transition-all" id="s4"></div>
        </div>
      </div>
      <div>
        <label class="label">Confirm Password</label>
        <div class="relative">
          <input type="password" name="confirm_password" required placeholder="Repeat password"
            class="input-field pr-12" id="confirm_password" autocomplete="new-password">
          <button type="button" onclick="togglePass('confirm_password','eyeC')" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-400 transition-colors">
            <svg id="eyeC" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </div>
      </div>
      <div>
        <label class="label">Invitation Code <span class="text-gray-600 normal-case font-normal">(Optional)</span></label>
        <input type="text" name="invitation_code" value="${inviteCode}" placeholder="XXXXXXXX"
          class="input-field font-mono uppercase tracking-widest" id="invite-code" autocomplete="off">
        ${inviteCode ? `<p class="mt-1 text-xs text-green-400 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg>
          Invitation code applied!</p>` : ''}
      </div>

      <div class="flex items-start gap-3 py-2">
        <input type="checkbox" name="agree" id="agree" required class="mt-0.5 w-4 h-4 rounded border-white/20 bg-dark-300 text-gold-500 focus:ring-gold-500/30 cursor-pointer">
        <label for="agree" class="text-sm text-gray-400 cursor-pointer leading-relaxed">
          I agree to the <a href="/terms" class="text-gold-400 hover:text-gold-300 transition-colors">Terms of Service</a> and <a href="/privacy" class="text-gold-400 hover:text-gold-300 transition-colors">Privacy Policy</a>
        </label>
      </div>

      <button type="submit" class="btn-gold w-full py-3.5" id="submit-btn">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
        Create Account
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Already have an account? 
      <a href="/login" class="text-gold-400 hover:text-gold-300 font-medium transition-colors">Sign In</a>
    </p>
  </div>

  <script>
    function togglePass(id, eyeId) {
      const input = document.getElementById(id)
      const eye = document.getElementById(eyeId)
      input.type = input.type === 'password' ? 'text' : 'password'
    }

    // Password strength meter
    document.getElementById('password').addEventListener('input', function() {
      const val = this.value
      const bars = [document.getElementById('s1'),document.getElementById('s2'),document.getElementById('s3'),document.getElementById('s4')]
      let strength = 0
      if (val.length >= 8) strength++
      if (/[A-Z]/.test(val)) strength++
      if (/[0-9]/.test(val)) strength++
      if (/[^A-Za-z0-9]/.test(val)) strength++
      const colors = ['bg-red-500','bg-orange-500','bg-yellow-500','bg-green-500']
      bars.forEach((bar, i) => {
        bar.className = 'h-1 flex-1 rounded-full transition-all ' + (i < strength ? colors[strength-1] : 'bg-dark-300')
      })
    })

    // Form loading state
    document.getElementById('reg-form').addEventListener('submit', function() {
      const btn = document.getElementById('submit-btn')
      btn.disabled = true
      btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Creating Account...'
    })

    // Auto-uppercase invite code
    document.getElementById('invite-code').addEventListener('input', function() {
      this.value = this.value.toUpperCase()
    })
  </script>`, {
    title: 'Create Account – SpinVault',
    description: 'Join SpinVault and start earning real money by spinning the wheel.',
  })
}

// ─── Login Page ───────────────────────────────────────────────────────────────
export function loginPage(opts: { error?: string; email?: string; redirect?: string }): string {
  const { error, email = '', redirect = '' } = opts
  return authLayout(`
  <div class="card p-8 animate-slide-up">
    <div class="text-center mb-8">
      <h1 class="font-display text-2xl font-bold text-white mb-2">Welcome Back</h1>
      <p class="text-gray-400 text-sm">Sign in to continue spinning</p>
    </div>

    ${error ? `<div class="alert alert-error mb-6"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${error}</div>` : ''}

    <form method="POST" action="/login" class="space-y-4" id="login-form">
      <input type="hidden" name="redirect" value="${redirect}">
      <div>
        <label class="label">Email Address</label>
        <input type="email" name="email" value="${email}" required placeholder="john@example.com"
          class="input-field" autocomplete="email">
      </div>
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="label mb-0">Password</label>
          <a href="/forgot-password" class="text-xs text-gold-500 hover:text-gold-400 transition-colors">Forgot password?</a>
        </div>
        <div class="relative">
          <input type="password" name="password" required placeholder="Your password"
            class="input-field pr-12" id="password" autocomplete="current-password">
          <button type="button" onclick="togglePass()" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-400 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </div>
      </div>

      <button type="submit" class="btn-gold w-full py-3.5" id="submit-btn">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
        Sign In
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Don't have an account? 
      <a href="/register" class="text-gold-400 hover:text-gold-300 font-medium transition-colors">Create one free</a>
    </p>
  </div>

  <script>
    function togglePass() {
      const input = document.getElementById('password')
      input.type = input.type === 'password' ? 'text' : 'password'
    }
    document.getElementById('login-form').addEventListener('submit', function() {
      const btn = document.getElementById('submit-btn')
      btn.disabled = true
      btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Signing In...'
    })
  </script>`, {
    title: 'Sign In – SpinVault',
    description: 'Sign in to SpinVault to access your account and start spinning.',
  })
}

// ─── Verify Email Page ────────────────────────────────────────────────────────
export function verifyEmailPage(opts: { error?: string; success?: string; email: string }): string {
  const { error, success, email } = opts
  return authLayout(`
  <div class="card p-8 animate-slide-up text-center">
    <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 border border-gold-500/30 flex items-center justify-center text-4xl animate-float">
      📧
    </div>
    <h1 class="font-display text-2xl font-bold text-white mb-2">Check Your Email</h1>
    <p class="text-gray-400 text-sm mb-2">We sent a 6-digit code to</p>
    <p class="text-gold-400 font-semibold mb-8">${email}</p>

    ${error ? `<div class="alert alert-error mb-6 text-left"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${error}</div>` : ''}
    ${success ? `<div class="alert alert-success mb-6 text-left"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${success}</div>` : ''}

    <form method="POST" action="/verify-email" class="space-y-4">
      <input type="hidden" name="email" value="${email}">
      <div>
        <label class="label">Verification Code</label>
        <input type="text" name="otp" required maxlength="6" placeholder="000000"
          class="input-field text-center text-3xl font-mono tracking-[0.5em] py-4 font-bold"
          autocomplete="one-time-code" inputmode="numeric" id="otp-input">
        <p class="mt-2 text-xs text-gray-500">Enter the 6-digit code from your email</p>
      </div>
      <button type="submit" class="btn-gold w-full py-3.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Verify Email
      </button>
    </form>

    <div class="mt-6 pt-6 border-t border-white/5">
      <p class="text-sm text-gray-500 mb-3">Didn't receive the code?</p>
      <form method="POST" action="/resend-otp">
        <input type="hidden" name="email" value="${email}">
        <button type="submit" class="btn-outline w-full py-2.5 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Resend Code
        </button>
      </form>
    </div>
  </div>

  <script>
    // Auto-format OTP input
    const otpInput = document.getElementById('otp-input')
    otpInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g,'').substring(0,6)
      if (this.value.length === 6) this.form.submit()
    })
    otpInput.focus()
  </script>`, {
    title: 'Verify Email – SpinVault',
  })
}
