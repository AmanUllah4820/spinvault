import { layout } from '../layout'

export function withdrawDetailsPage(opts: {
  user: { id: number; full_name: string; email: string }
  existing?: {
    bank_country: string; bank_name: string; account_holder_name: string
    account_number: string; routing_number?: string; swift_code?: string
  } | null
  error?: string
  success?: string
  balance?: number
}): string {
  const { user, existing, error, success, balance = 0 } = opts

  return layout(`
  <div class="max-w-2xl mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
        <div>
          <h1 class="font-display text-xl font-bold text-white">Bank Details</h1>
          <p class="text-gray-400 text-sm">Set up your withdrawal information</p>
        </div>
      </div>

      <!-- Progress Steps -->
      <div class="flex items-center gap-2 mt-6">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          </div>
          <span class="text-xs text-green-400 font-medium">Registered</span>
        </div>
        <div class="flex-1 h-px bg-gradient-to-r from-green-500/50 to-gold-500/50"></div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-dark-400 text-xs font-bold">2</div>
          <span class="text-xs text-gold-400 font-medium">Bank Details</span>
        </div>
        <div class="flex-1 h-px bg-white/10"></div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-dark-300 border border-white/20 flex items-center justify-center text-gray-500 text-xs font-bold">3</div>
          <span class="text-xs text-gray-500 font-medium">Deposit</span>
        </div>
        <div class="flex-1 h-px bg-white/10"></div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-dark-300 border border-white/20 flex items-center justify-center text-gray-500 text-xs font-bold">4</div>
          <span class="text-xs text-gray-500 font-medium hidden sm:block">Play</span>
        </div>
      </div>
    </div>

    ${error ? `<div class="alert alert-error mb-6"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${error}</div>` : ''}
    ${success ? `<div class="alert alert-success mb-6"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${success}</div>` : ''}

    <div class="card p-6 md:p-8">
      <form method="POST" action="/user/WithdrawDetails" class="space-y-5" id="withdraw-form">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div class="sm:col-span-2">
            <label class="label">Bank Country</label>
            <div class="relative">
              <select name="bank_country" id="bank_country" required class="input-field appearance-none pr-10 cursor-pointer"
                onchange="handleCountryChange(this.value)">
                <option value="">— Select Country —</option>
                ${COUNTRIES.map(c => `<option value="${c.code}" ${existing?.bank_country === c.code ? 'selected' : ''}>${c.flag} ${c.name}</option>`).join('')}
              </select>
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
            <p class="mt-1 text-xs text-gray-600 flex items-center gap-1" id="country-auto-note">
              <svg class="w-3 h-3 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Detecting your location...
            </p>
          </div>

          <div class="sm:col-span-2">
            <label class="label">Bank Name</label>
            <input type="text" name="bank_name" value="${existing?.bank_name || ''}" required
              placeholder="e.g. Habib Bank Limited" class="input-field">
          </div>

          <div class="sm:col-span-2">
            <label class="label">Account Holder Name</label>
            <input type="text" name="account_holder_name" value="${existing?.account_holder_name || user.full_name}"
              required readonly class="input-field bg-dark-300/40 cursor-not-allowed text-gray-400">
          </div>

          <div class="sm:col-span-2">
            <label class="label">Account Number / IBAN</label>
            <input type="text" name="account_number" value="${existing?.account_number || ''}" required
              placeholder="Enter your account number" class="input-field font-mono tracking-wider"
              id="account_number">
          </div>

          <!-- International fields - shown for non-Pakistan -->
          <div id="routing-field" class="${existing?.routing_number ? '' : 'hidden'}">
            <label class="label">Routing Number <span class="text-gold-500">*</span></label>
            <input type="text" name="routing_number" value="${existing?.routing_number || ''}"
              placeholder="9-digit routing number" class="input-field font-mono" id="routing_number">
          </div>

          <div id="swift-field" class="${existing?.swift_code ? '' : 'hidden'}">
            <label class="label">SWIFT / BIC Code <span class="text-gold-500">*</span></label>
            <input type="text" name="swift_code" value="${existing?.swift_code || ''}"
              placeholder="e.g. HABBPKKA" class="input-field font-mono uppercase tracking-widest"
              id="swift_code">
          </div>
        </div>

        <!-- Info box -->
        <div class="p-4 bg-gold-500/5 border border-gold-500/20 rounded-xl">
          <div class="flex items-start gap-3">
            <svg class="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-xs text-gold-300/80 leading-relaxed">
              Your bank details are securely stored and only used for processing withdrawal requests. 
              Make sure all details are accurate to avoid payment delays.
            </p>
          </div>
        </div>

        <button type="submit" class="btn-gold w-full py-3.5" id="save-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          Save & Continue to Deposit
        </button>
      </form>
    </div>
  </div>

  <script>
    const PAKISTAN_CODE = 'PK'
    
    function handleCountryChange(code) {
      const isInternational = code && code !== PAKISTAN_CODE
      document.getElementById('routing-field').classList.toggle('hidden', !isInternational)
      document.getElementById('swift-field').classList.toggle('hidden', !isInternational)
      const rn = document.getElementById('routing_number')
      const sc = document.getElementById('swift_code')
      if (rn) rn.required = isInternational
      if (sc) sc.required = isInternational
    }

    // Auto-detect country from IP
    async function detectCountry() {
      try {
        const res = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        const select = document.getElementById('bank_country')
        const note = document.getElementById('country-auto-note')
        if (data.country_code && !select.value) {
          select.value = data.country_code
          handleCountryChange(data.country_code)
          note.innerHTML = '<svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>Auto-detected: ' + (data.country_name || data.country_code)
          note.className = 'mt-1 text-xs text-green-400 flex items-center gap-1'
        } else {
          note.textContent = ''
        }
      } catch(e) {
        document.getElementById('country-auto-note').textContent = ''
      }
    }

    ${existing?.bank_country ? `handleCountryChange('${existing.bank_country}')` : 'detectCountry()'}

    document.getElementById('withdraw-form').addEventListener('submit', function() {
      const btn = document.getElementById('save-btn')
      btn.disabled = true
      btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Saving...'
    })
  </script>`, {
    title: 'Bank Details – SpinVault',
    activePage: 'profile',
    userName: user.full_name,
    userBalance: balance,
  })
}

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
]
