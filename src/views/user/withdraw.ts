import { layout } from '../layout'

interface WithdrawalRequest {
  id: number
  amount: number
  status: string
  created_at: string
  note?: string
  account_number: string
  txn_id: string
}

export function withdrawPage(opts: {
  user: { id: number; full_name: string }
  balance: number
  hasWithdrawDetails: boolean
  withdrawHistory: WithdrawalRequest[]
  error?: string
  success?: string
}): string {
  const { user, balance, hasWithdrawDetails, withdrawHistory, error, success } = opts
  const minWithdraw = 10
  const canWithdraw = balance >= minWithdraw && hasWithdrawDetails

  const historyRows = withdrawHistory.length
  ? withdrawHistory.map(w => {
      const statusColor = {
        pending:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        paid:       'bg-green-500/15 text-green-400 border-green-500/30',
        rejected:   'bg-red-500/15 text-red-400 border-red-500/30',
      }[w.status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'

      const statusSteps = ['pending', 'processing', 'paid']
      const stepIndex = statusSteps.indexOf(w.status)

      // Mask account: show last 4 digits only
      const masked = w.account_number
        ? '••••' + String(w.account_number).slice(-4)
        : '—'

      // Format date with timezone
      const date = new Date(w.created_at)
      const formatted = date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      })

      return `<tr>
        <td class="px-4 py-3 font-mono text-xs text-gray-400">${w.txn_id || '—'}</td>
        <td class="px-4 py-3 font-mono text-gold-400 font-semibold">$${w.amount.toFixed(2)}</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="badge border ${statusColor} text-xs capitalize">${w.status}</span>
            ${w.status !== 'rejected' ? `
            <div class="flex gap-0.5">
              ${statusSteps.map((s, i) => `
                <div class="w-1.5 h-1.5 rounded-full ${i <= stepIndex ? 'bg-gold-400' : 'bg-white/10'}"></div>
              `).join('')}
            </div>` : ''}
          </div>
        </td>
        <td class="px-4 py-3 text-gray-500 text-xs">${formatted}</td>
        <td class="px-4 py-3 font-mono text-xs text-gray-400">${masked}</td>
      </tr>`
    }).join('')
  : `<tr><td colspan="5" class="px-4 py-8 text-center text-gray-600">No withdrawal history yet</td></tr>`

  return layout(`
  <div class="max-w-3xl mx-auto px-4 py-8 space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
        <svg class="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </div>
      <div>
        <h1 class="font-display text-xl font-bold text-white">Withdraw Funds</h1>
        <p class="text-gray-400 text-sm">Cash out your earnings to your bank account</p>
      </div>
    </div>

    ${error   ? `<div class="alert alert-error"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${error}</div>` : ''}
    ${success ? `<div class="alert alert-success"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${success}</div>` : ''}

    <!-- Balance Card -->
    <div class="card p-6 border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Available Balance</p>
          <p class="text-4xl font-bold font-mono text-gold-400">$${balance.toFixed(2)}</p>
          <p class="text-xs text-gray-500 mt-1">Min withdrawal: $${minWithdraw}.00</p>
        </div>
        <div class="text-6xl opacity-20">💰</div>
      </div>

      ${!hasWithdrawDetails ? `
      <div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl flex items-center gap-3">
        <svg class="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-yellow-300 text-xs">
          You need to set up your bank details before withdrawing.
          <a href="/user/WithdrawDetails" class="underline font-semibold ml-1">Set up now →</a>
        </p>
      </div>` : ''}
    </div>

    <!-- Withdraw Form -->
    ${canWithdraw ? `
    <div class="card p-6">
      <h2 class="font-display font-bold text-white mb-5 flex items-center gap-2">
        <svg class="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Request Withdrawal
      </h2>

      <form method="POST" action="/user/withdraw" id="withdraw-form" class="space-y-4">
        <div>
          <label class="label">Amount (USD)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400 font-bold text-lg">$</span>
            <input type="number" name="amount" id="withdraw-amount" required
              min="${minWithdraw}" max="${balance.toFixed(2)}" step="0.01"
              placeholder="${minWithdraw}.00"
              class="input-field pl-8 text-lg font-mono font-semibold">
          </div>
          <div class="flex justify-between mt-2">
            <span class="text-xs text-gray-500">Min: $${minWithdraw}.00</span>
            <span class="text-xs text-gray-500">Max: $${balance.toFixed(2)}</span>
          </div>
          <!-- Quick amount buttons -->
          <div class="flex gap-2 mt-3 flex-wrap">
            ${[10, 25, 50, 100].filter(v => v <= balance).map(v =>
              `<button type="button" onclick="setAmount(${v})"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 text-gray-400
                hover:border-gold-500/40 hover:text-gold-400 transition-all">
                $${v}
              </button>`
            ).join('')}
            <button type="button" onclick="setAmount(${balance.toFixed(2)})"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 text-gray-400
              hover:border-gold-500/40 hover:text-gold-400 transition-all">
              Max
            </button>
          </div>
        </div>

        <div>
          <label class="label">Note (Optional)</label>
          <input type="text" name="note" placeholder="Any note for admin..."
            class="input-field" maxlength="200">
        </div>

        <div class="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-300/80 flex items-start gap-2">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Withdrawals are processed within 1–3 business days to your registered bank account. Make sure your bank details are up to date.</span>
        </div>

        <button type="submit" class="btn-gold w-full py-3.5" id="submit-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          Request Withdrawal
        </button>
      </form>
    </div>` : !hasWithdrawDetails ? `
    <div class="card p-6 text-center border border-dashed border-white/15">
      <div class="text-5xl mb-3">🏦</div>
      <h3 class="font-bold text-white mb-2">Set Up Bank Details First</h3>
      <p class="text-gray-400 text-sm mb-5">Add your bank account information to enable withdrawals.</p>
      <a href="/user/WithdrawDetails" class="btn-gold inline-flex">
        Set Up Bank Details →
      </a>
    </div>` : `
    <div class="card p-6 text-center border border-dashed border-white/15">
      <div class="text-5xl mb-3">💸</div>
      <h3 class="font-bold text-white mb-2">Insufficient Balance</h3>
      <p class="text-gray-400 text-sm mb-5">You need at least $${minWithdraw}.00 to withdraw. Keep spinning to earn more!</p>
      <a href="/user/dashboard#spin" class="btn-gold inline-flex">
        Go Spin Now →
      </a>
    </div>`}

    <!-- Withdrawal History -->
    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-white/5">
        <h2 class="font-display font-bold text-white flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          Withdrawal History
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>TXN ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Account</th>
            </tr>
          </thead>
          <tbody>${historyRows}</tbody>
        </table>
      </div>
    </div>

  </div>

  <script>
    function setAmount(val) {
      document.getElementById('withdraw-amount').value = parseFloat(val).toFixed(2)
    }
    const form = document.getElementById('withdraw-form')
    if (form) form.addEventListener('submit', function() {
      const btn = document.getElementById('submit-btn')
      btn.disabled = true
      btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Submitting...'
    })
  </script>`,
  {
    title: 'Withdraw Funds – SpinVault',
    activePage: 'withdraw',
    userName: user.full_name,
    userBalance: balance,
  })
}
