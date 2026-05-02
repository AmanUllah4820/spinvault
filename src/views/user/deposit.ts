import { layout } from '../layout'
import type { Plan } from '../../types'

const PLAN_ICONS: Record<string, string> = {
  gray:   '🎯',
  blue:   '💎',
  silver: '⭐',
  gold:   '🏆',
  purple: '👑',
}
const PLAN_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  gray:   { border: 'border-gray-600/40',   bg: 'bg-gray-500/10',   badge: 'bg-gray-500/20 text-gray-300' },
  blue:   { border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   badge: 'bg-blue-500/20 text-blue-300' },
  silver: { border: 'border-slate-400/40',  bg: 'bg-slate-400/10',  badge: 'bg-slate-400/20 text-slate-300' },
  gold:   { border: 'border-gold-500/60',   bg: 'bg-gold-500/10',   badge: 'bg-gold-500/20 text-gold-300' },
  purple: { border: 'border-purple-500/50', bg: 'bg-purple-500/10', badge: 'bg-purple-500/20 text-purple-300' },
}

export function depositPage(opts: {
  user: { id: number; full_name: string; email: string }
  plans: Plan[]
  balance: number
  error?: string
  success?: string
  appUrl?: string
}): string {
  const { user, plans, balance, error, success, appUrl = '' } = opts

  const planCards = plans.map(p => {
    const colors = PLAN_COLORS[p.color] || PLAN_COLORS.gray
    const icon = PLAN_ICONS[p.color] || '🎯'
    const isPopular = p.popular === 1
    return `
    <div class="plan-card border ${colors.border} ${isPopular ? 'featured' : ''} relative" 
         id="plan-${p.id}" onclick="selectPlan('${p.id}', ${p.min_deposit}, ${p.max_deposit}, '${p.name}')">
      <div class="flex items-start justify-between mb-4">
        <div>
          <span class="text-3xl">${icon}</span>
          <h3 class="font-display font-bold text-white text-lg mt-1">${p.name}</h3>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold text-white">$${p.min_deposit}${p.max_deposit > p.min_deposit ? `<span class="text-base text-gray-400">–$${p.max_deposit}</span>` : ''}</p>
        </div>
      </div>
      <div class="space-y-2 mb-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Daily rate
          </span>
          <span class="font-semibold text-green-400">${p.earning_rate}%</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Daily Spins
          </span>
          <span class="font-semibold text-gold-400">${p.daily_spins} spins</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Monthly Potential
          </span>
          <span class="font-semibold text-white">~${(p.earning_rate * 30).toFixed(0)}%</span>
        </div>
      </div>
      <div class="w-full h-1 rounded-full ${colors.bg} border ${colors.border}">
        <div class="h-full rounded-full bg-current transition-all" style="width:${Math.min(100,(p.earning_rate/4)*100)}%;background:currentColor"></div>
      </div>
      <button class="btn-gold w-full mt-4 text-sm py-2.5 select-plan-btn" data-plan="${p.id}">
        Select ${p.name} Plan
      </button>
    </div>`
  }).join('')

  // ── FIX: all items use backtick template literals so ${user.id} is evaluated ──
  const bankDetails = [
    `Bank Name:Citibank`,
    `Account Name:AIMZCART LLC`,
    `Account Number:70585650002103264`,
    `Routing Number:031100209`,
    `Reference:SV-${user.id}`,
  ]

  return layout(`
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-10">
      <h1 class="font-display text-3xl md:text-4xl font-bold text-white mb-3">
        Choose Your <span class="text-gradient">Investment Plan</span>
      </h1>
      <p class="text-gray-400 max-w-lg mx-auto">Select a plan that fits your budget and start earning through daily spins</p>
    </div>

    ${error ? `<div class="alert alert-error mb-6 max-w-xl mx-auto"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${error}</div>` : ''}
    ${success ? `<div class="alert alert-success mb-6 max-w-xl mx-auto"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${success}</div>` : ''}

    <!-- Plans Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
      ${planCards}
    </div>

    <!-- Payment Modal Overlay -->
    <div id="payment-modal" class="fixed inset-0 bg-dark-400/90 backdrop-blur-sm z-50 flex items-end md:items-center justify-center hidden animate-fade-in">
      <div class="w-full md:max-w-lg bg-dark-100 border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="font-display text-xl font-bold text-white" id="modal-plan-name">Complete Deposit</h2>
            <p class="text-gray-400 text-sm mt-0.5">Choose your payment method</p>
          </div>
          <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-dark-300 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-100 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Amount Input -->
        <div class="mb-6">
          <label class="label">Deposit Amount (USD)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400 font-bold text-lg">$</span>
            <input type="number" id="deposit-amount" class="input-field pl-8 text-lg font-semibold" placeholder="0.00" step="0.01">
          </div>
          <p class="mt-1 text-xs text-gray-500" id="amount-range">Enter amount between $0 – $0</p>
        </div>

        <!-- Payment Methods -->
        <div class="space-y-3 mb-6">
          <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Payment Methods</h3>

          <!-- Manual Bank Transfer -->
          <div class="p-4 bg-dark-300/60 border border-white/10 rounded-xl cursor-pointer hover:border-gold-500/40 transition-all" onclick="showPaymentDetails('manual')">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-xl">🏦</div>
              <div class="flex-1">
                <p class="font-semibold text-white text-sm">Manual Bank Transfer</p>
                <p class="text-xs text-gray-400">USA Bank / Wire Transfer</p>
              </div>
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </div>
          </div>

          <!-- PayFast -->
          <div class="p-4 bg-dark-300/60 border border-white/10 rounded-xl cursor-pointer hover:border-gold-500/40 transition-all" onclick="payViaPayFast()">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-xl">💳</div>
              <div class="flex-1">
                <p class="font-semibold text-white text-sm">PayFast</p>
                <p class="text-xs text-gray-400">Cards, EFT, Instant Pay</p>
              </div>
              <span class="badge bg-green-500/15 text-green-400 text-xs">Fast</span>
            </div>
          </div>
        </div>

        <!-- Manual Payment Details (hidden by default) -->
        <div id="manual-payment" class="hidden">
          <div class="p-4 bg-dark-300/60 border border-gold-500/20 rounded-xl mb-4 space-y-3">
            <h4 class="text-sm font-semibold text-gold-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              US Bank Transfer Details
            </h4>
            <div class="space-y-2">
              ${bankDetails.map(item => {
                const [label, value] = item.split(':')
                return `<div class="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                  <span class="text-xs text-gray-500">${label}</span>
                  <span class="text-xs font-mono text-white font-medium">${value}</span>
                </div>`
              }).join('')}
            </div>
          </div>

          <form method="POST" action="/user/deposit" id="deposit-form">
            <input type="hidden" name="plan_id" id="selected-plan-id">
            <input type="hidden" name="amount" id="form-amount">
            <input type="hidden" name="payment_method" value="manual">
            <div class="mb-4">
              <label class="label">Transaction Reference / Screenshot URL</label>
              <input type="text" name="transaction_ref" placeholder="Transaction ID or proof link" class="input-field" required>
              <p class="mt-1 text-xs text-gray-500">Enter your transaction ID after completing the transfer</p>
            </div>
            <button type="submit" class="btn-gold w-full py-3" onclick="return validateAndSubmit()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Submit Deposit Request
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Earnings Calculator -->
    <div class="card p-6 max-w-2xl mx-auto">
      <h2 class="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>📊</span> Earnings Calculator
      </h2>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-xs text-gray-500 mb-1">Daily</p>
          <p class="font-bold text-green-400 text-lg" id="calc-daily">$0.00</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Weekly</p>
          <p class="font-bold text-blue-400 text-lg" id="calc-weekly">$0.00</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Monthly</p>
          <p class="font-bold text-gold-400 text-lg" id="calc-monthly">$0.00</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    let selectedPlanId = null
    let selectedPlanMin = 0
    let selectedPlanMax = 0
    let selectedEarningRate = 0
    const plans = ${JSON.stringify(plans.map(p => ({ id: p.id, min: p.min_deposit, max: p.max_deposit, rate: p.earning_rate, name: p.name })))}

    function selectPlan(id, min, max, name) {
      selectedPlanId = id
      selectedPlanMin = min
      selectedPlanMax = max
      const plan = plans.find(p => p.id === id)
      selectedEarningRate = plan ? plan.earning_rate : 0

      // Update cards UI
      document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'))
      document.getElementById('plan-' + id).classList.add('selected')
      
      // Update modal
      document.getElementById('modal-plan-name').textContent = name + ' Plan'
      document.getElementById('amount-range').textContent = 'Enter amount between $' + min + ' – $' + max
      document.getElementById('deposit-amount').min = min
      document.getElementById('deposit-amount').max = max
      document.getElementById('deposit-amount').value = min
      document.getElementById('selected-plan-id').value = id
      
      updateCalc(min, selectedEarningRate)
      document.getElementById('payment-modal').classList.remove('hidden')
    }

    function closeModal() {
      document.getElementById('payment-modal').classList.add('hidden')
      document.getElementById('manual-payment').classList.add('hidden')
    }

    function showPaymentDetails(method) {
      document.getElementById('manual-payment').classList.remove('hidden')
    }

    function payViaPayFast() {
      const amount = parseFloat(document.getElementById('deposit-amount').value)
      if (!amount || amount < selectedPlanMin || amount > selectedPlanMax) {
        alert('Please enter a valid amount between $' + selectedPlanMin + ' and $' + selectedPlanMax)
        return
      }
      const params = new URLSearchParams({
        plan_id: selectedPlanId,
        amount: amount.toFixed(2),
      })
      window.location.href = '/payment/payfast?' + params.toString()
    }

    function validateAndSubmit() {
      const amount = parseFloat(document.getElementById('deposit-amount').value)
      if (!amount || amount < selectedPlanMin || amount > selectedPlanMax) {
        alert('Please enter a valid amount between $' + selectedPlanMin + ' and $' + selectedPlanMax)
        return false
      }
      document.getElementById('form-amount').value = amount.toFixed(2)
      return true
    }

    function updateCalc(amount, rate) {
      const daily = (amount * rate / 100)
      document.getElementById('calc-daily').textContent = '$' + daily.toFixed(2)
      document.getElementById('calc-weekly').textContent = '$' + (daily * 7).toFixed(2)
      document.getElementById('calc-monthly').textContent = '$' + (daily * 30).toFixed(2)
    }

    document.getElementById('deposit-amount').addEventListener('input', function() {
      const amount = parseFloat(this.value) || 0
      updateCalc(amount, selectedEarningRate)
      document.getElementById('form-amount').value = amount.toFixed(2)
    })

    // Close modal on backdrop click
    document.getElementById('payment-modal').addEventListener('click', function(e) {
      if (e.target === this) closeModal()
    })
  </script>`, {
    title: 'Deposit & Choose Plan – SpinVault',
    description: 'Choose an investment plan and start earning through daily spins.',
    activePage: 'deposit',
    userName: user.full_name,
    userBalance: balance,
  })
}
