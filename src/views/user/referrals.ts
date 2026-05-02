import { layout } from '../layout'

interface Referral {
  referred_name: string
  referred_email: string
  joined_at: string
  deposited: number
}

export function referralsPage(opts: {
  user: { id: number; full_name: string }
  balance: number
  inviteCode: string
  referrals: Referral[]
  appUrl: string
}): string {
  const { user, balance, inviteCode, referrals, appUrl } = opts
  const inviteUrl = `${appUrl}/register?ref=${inviteCode}`

  const referralRows = referrals.length
    ? referrals.map(r => `
      <tr>
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-400 font-bold text-xs">
              ${r.referred_name[0].toUpperCase()}
            </div>
            <div>
              <p class="text-sm font-medium text-white">${r.referred_name}</p>
              <p class="text-xs text-gray-500">${r.referred_email}</p>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <span class="${r.deposited > 0 ? 'text-green-400' : 'text-gray-500'} font-mono text-sm">
            $${r.deposited.toFixed(2)}
          </span>
        </td>
        <td class="px-4 py-3 text-gray-500 text-xs">
          ${new Date(r.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </td>
        <td class="px-4 py-3">
          <span class="badge ${r.deposited > 0 ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'} text-xs">
            ${r.deposited > 0 ? 'Active' : 'Pending'}
          </span>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="4" class="px-4 py-10 text-center text-gray-600">
        <div class="flex flex-col items-center gap-2">
          <span class="text-4xl">👥</span>
          <p class="text-sm">No referrals yet. Share your link to start earning!</p>
        </div>
      </td></tr>`

  return layout(`
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
        <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>
      <div>
        <h1 class="font-display text-xl font-bold text-white">Referral Program</h1>
        <p class="text-gray-400 text-sm">Invite friends and earn when they deposit</p>
      </div>
    </div>

    <!-- How it works -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      ${[
        { step: '1', icon: '🔗', title: 'Share Your Link', desc: 'Send your unique invite link to friends' },
        { step: '2', icon: '📝', title: 'Friend Registers', desc: 'They create an account using your link' },
        { step: '3', icon: '💰', title: 'You Both Earn', desc: 'Get bonuses when they make deposits' },
      ].map(s => `
      <div class="card p-5 text-center">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-dark-400 font-bold text-sm mx-auto mb-3 flex items-center justify-center">${s.step}</div>
        <div class="text-3xl mb-2">${s.icon}</div>
        <h3 class="font-semibold text-white text-sm mb-1">${s.title}</h3>
        <p class="text-gray-400 text-xs">${s.desc}</p>
      </div>`).join('')}
    </div>

    <!-- Invite Link Card -->
    <div class="card p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
      <h2 class="font-display font-bold text-white mb-4 flex items-center gap-2">
        <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
        Your Invite Link
      </h2>

      <!-- Invite URL -->
      <div class="flex gap-2 mb-4">
        <input type="text" id="invite-url" value="${inviteUrl}" readonly
          class="input-field flex-1 font-mono text-xs text-gray-300 cursor-pointer select-all">
        <button onclick="copyLink()" id="copy-btn"
          class="btn-outline px-4 flex-shrink-0 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Copy
        </button>
      </div>

      <!-- Code display -->
      <div class="flex items-center gap-3 p-3 bg-dark-300/60 rounded-xl mb-4">
        <span class="text-gray-400 text-xs font-medium">Your Code:</span>
        <span class="font-mono font-bold text-gold-400 text-lg tracking-widest">${inviteCode}</span>
        <button onclick="copyCode()" class="ml-auto text-xs text-gray-500 hover:text-gold-400 transition-colors">Copy Code</button>
      </div>

      <!-- Share Buttons -->
      <div class="flex flex-wrap gap-2">
        <a href="https://wa.me/?text=${encodeURIComponent('Join SpinVault and win real money! Use my invite: ' + inviteUrl)}"
          target="_blank" rel="noopener"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/20 border border-green-600/30 text-green-400 text-xs font-semibold hover:bg-green-600/30 transition-all">
          <span class="text-base">📱</span> WhatsApp
        </a>
        <a href="https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Join SpinVault – Spin & Win real money!')}"
          target="_blank" rel="noopener"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/30 transition-all">
          <span class="text-base">✈️</span> Telegram
        </a>
        <button onclick="shareNative()"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-300/60 border border-white/10 text-gray-300 text-xs font-semibold hover:border-white/25 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
          Share
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="stat-card text-center">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Total Referrals</p>
        <p class="text-3xl font-bold text-white">${referrals.length}</p>
      </div>
      <div class="stat-card text-center">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Active</p>
        <p class="text-3xl font-bold text-green-400">${referrals.filter(r => r.deposited > 0).length}</p>
      </div>
      <div class="stat-card text-center">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Their Deposits</p>
        <p class="text-3xl font-bold text-gold-400">$${referrals.reduce((sum, r) => sum + r.deposited, 0).toFixed(0)}</p>
      </div>
    </div>

    <!-- Referral Table -->
    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-white/5">
        <h2 class="font-display font-bold text-white">Referred Users</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Deposited</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${referralRows}</tbody>
        </table>
      </div>
    </div>

  </div>

  <script>
    function copyLink() {
      const url = document.getElementById('invite-url').value
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-btn')
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Copied!'
        btn.classList.add('text-green-400', 'border-green-500/40')
        setTimeout(() => {
          btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy'
          btn.classList.remove('text-green-400', 'border-green-500/40')
        }, 2000)
      })
    }
    function copyCode() {
      navigator.clipboard.writeText('${inviteCode}')
    }
    function shareNative() {
      if (navigator.share) {
        navigator.share({ title: 'Join SpinVault', text: 'Spin the wheel, win real money!', url: '${inviteUrl}' })
      } else {
        copyLink()
      }
    }
  </script>`,
  {
    title: 'Referrals – SpinVault',
    activePage: 'referrals',
    userName: user.full_name,
    userBalance: balance,
  })
}
