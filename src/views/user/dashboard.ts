import { layout } from '../layout'
import { WHEEL_SEGMENTS } from '../../utils/crypto'
import type { DashboardData } from '../../types'

export function dashboardPage(data: DashboardData): string {
  const { user, wallet, activeDeposit, recentSpins, totalSpinsToday } = data
  const spinsLeft = wallet.spins_left
  const hasActiveDeposit = !!activeDeposit
  const freeSpinsLeft = wallet.free_left ?? 0
  const canFreeSpin = freeSpinsLeft > 0 && !hasActiveDeposit
  const canSpin = canFreeSpin || (hasActiveDeposit && spinsLeft > 0 && wallet.balance >= 0.50)

  // Build wheel SVG
  const wheelSVG = buildWheelSVG()

  const spinHistory = recentSpins.slice(0, 8).map(s => {
    const seg = WHEEL_SEGMENTS[s.segment_index]
    const won = s.multiplier > 0
    return `
    <div class="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${won ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
          ${won ? '▲' : '▼'}
        </div>
        <div>
          <p class="text-sm font-medium text-white">${won ? '+$' + s.earning.toFixed(2) : 'No Win'}</p>
          <p class="text-xs text-gray-500">${seg?.label || '0x'} multiplier</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xs text-gray-400">-$${s.fee.toFixed(2)} fee</p>
        <p class="text-xs ${s.net > 0 ? 'text-green-400' : 'text-red-400'}">${s.net > 0 ? '+' : ''}$${s.net.toFixed(2)}</p>
      </div>
    </div>`
  }).join('') || '<p class="text-gray-500 text-sm text-center py-4">No spins yet. Start spinning to earn!</p>'

  return layout(`
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Welcome Banner -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="font-display text-2xl font-bold text-white">
          Welcome back, <span class="text-gradient">${user.full_name.split(' ')[0]}</span> 👋
        </h1>
        <p class="text-gray-400 text-sm mt-1">${hasActiveDeposit ? `Active plan: ${activeDeposit!.plan_name}` : 'Deposit to start playing'}</p>
      </div>
      ${!hasActiveDeposit ? `
      <a href="/user/deposit" class="btn-gold text-sm py-2.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Deposit Now
      </a>` : ''}
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="stat-card">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Balance</p>
        <p class="text-2xl font-bold font-mono text-gold-400">$${wallet.balance.toFixed(2)}</p>
        <p class="text-xs text-gray-600">Available</p>
      </div>
      <div class="stat-card">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Earned</p>
        <p class="text-2xl font-bold font-mono text-green-400">$${wallet.total_earned.toFixed(2)}</p>
        <p class="text-xs text-gray-600">All time</p>
      </div>
      <div class="stat-card">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Spins Left</p>
        <p class="text-2xl font-bold font-mono text-blue-400">${spinsLeft}</p>
        <p class="text-xs text-gray-600">Today</p>
      </div>
      <div class="stat-card">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Deposited</p>
        <p class="text-2xl font-bold font-mono text-purple-400">$${wallet.total_deposited.toFixed(2)}</p>
        <p class="text-xs text-gray-600">Total</p>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Wheel + Legend + Payout Feed (2/3 width) -->
      <div class="lg:col-span-2 space-y-3">

        <!-- Spin Wheel Card -->
        <div class="card p-4" id="spin">
          <div class="text-center mb-4">
            <h2 class="font-display text-xl font-bold text-white mb-1">Spin the Wheel</h2>
            <p class="text-gray-400 text-sm">
              ${canFreeSpin
                ? `<span class="text-gold-400 font-semibold">🎁 1 Free Spin Available!</span> · Resets every 24 hours`
                : canSpin
                ? `${spinsLeft} spins remaining today · $0.50 per spin`
                : spinsLeft === 0
                ? 'Daily spin limit reached.'
                : 'Insufficient balance for spin fee ($0.50 required)'}
            </p>
          </div>

          <!-- Wheel -->
          <div class="relative mx-auto mb-4" style="width:220px;height:220px;">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 z-20 -translate-y-1">
              <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:20px solid #f59e0b;filter:drop-shadow(0 2px 4px rgba(245,158,11,0.6));"></div>
            </div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-dark-400 border-3 border-gold-500 shadow-md shadow-gold-500/40 flex items-center justify-center text-sm">🎰</div>
            <canvas id="wheel-canvas" width="220" height="220" class="rounded-full shadow-xl shadow-gold-500/20"></canvas>
          </div>

          <!-- Spin Button -->
          <div class="text-center">
          ${canFreeSpin ? `
          <button id="spin-btn" onclick="doSpin()"
            class="btn-gold px-8 py-3 text-sm animate-pulse-gold hover:animate-none ring ring-gold-500/40">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>
            🎁 USE FREE SPIN
          </button>
          <p class="mt-2 text-xs text-gold-400/70">No deposit needed · Resets every 24 hours</p>
          ` : canSpin ? `
          <button id="spin-btn" onclick="doSpin()"
            class="btn-gold px-8 py-3 text-sm animate-pulse-gold hover:animate-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            SPIN NOW · $0.50
          </button>
          <p class="mt-2 text-xs text-gray-600">Spin fee deducted from balance. Must maintain positive balance.</p>
          ` : hasActiveDeposit ? `
          <button disabled class="btn-gold px-8 py-3 text-sm opacity-50 cursor-not-allowed">
            ${spinsLeft === 0 ? '⏳ Come Back Tomorrow' : '💰 Insufficient Balance'}
          </button>
          <p class="mt-2 text-xs text-gray-600">Spin fee deducted from balance. Must maintain positive balance.</p>
          ` : `
          <div class="space-y-2">
            <p class="text-xs text-gray-500">Free spin used · Reset in <span id="countdown">23:59:59</span></p>
            <a href="/user/deposit" class="btn-gold inline-flex items-center gap-2 px-8 py-3 text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Deposit to Play
            </a>
          </div>`}
          </div>

          <!-- Result Display -->
          <div id="spin-result" class="hidden mt-4 p-3 rounded-xl border text-center animate-slide-up">
            <p class="text-base font-bold" id="result-text"></p>
            <p class="text-xs text-gray-400 mt-1" id="result-sub"></p>
          </div>
        </div>

        <!-- Wheel Legend -->
        <div class="card p-3">
          <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Wheel Segments</p>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
            ${WHEEL_SEGMENTS.map(s => `
            <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-300/40">
              <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${s.color}"></div>
              <span class="text-xs font-mono font-medium text-gray-300">${s.label}</span>
            </div>`).join('')}
          </div>
        </div>

        <!-- ─── Live Payout Feed ─────────────────────────────────────────── -->
        <div class="card overflow-hidden border border-green-500/20">

          <!-- Header -->
          <div class="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <p class="text-xs font-semibold text-gray-300 uppercase tracking-wide">Latest Payouts</p>
            </div>
          </div>

          <!-- Feed rows -->
          <div id="payout-feed" class="divide-y divide-white/5 max-h-72 overflow-y-auto">
            <!-- Skeleton loaders shown while fetching -->
            ${Array(5).fill(0).map(() => `
            <div class="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div class="w-9 h-9 rounded-full bg-white/5 flex-shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-white/5 rounded w-28"></div>
                <div class="h-2 bg-white/5 rounded w-16"></div>
              </div>
              <div class="space-y-1 text-right">
                <div class="h-3 bg-white/5 rounded w-14"></div>
                <div class="h-2 bg-white/5 rounded w-10 ml-auto"></div>
              </div>
            </div>`).join('')}
          </div>

          <!-- Footer CTA -->
          <div class="px-4 py-3 border-t border-white/5 bg-green-500/5 flex items-center justify-between">
            <p class="text-xs text-gray-500">Showing last 20 confirmed payouts</p>
            <a href="/user/withdraw" class="text-xs text-green-400 font-semibold hover:text-green-300 transition-colors flex items-center gap-1">
              Withdraw
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
        <!-- ─── End Live Payout Feed ───────────────────────────────────── -->

      </div>

      <!-- Sidebar (1/3 width) -->
      <div class="space-y-4">
        <!-- Active Plan -->
        ${hasActiveDeposit ? `
        <div class="card p-5 border border-gold-500/20">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">🏆</span>
            <h3 class="font-semibold text-white text-sm">Active Plan</h3>
            <span class="badge bg-green-500/20 text-green-400 ml-auto text-xs">Active</span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Plan</span>
              <span class="text-white font-medium">${activeDeposit!.plan_name}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Deposited</span>
              <span class="text-gold-400 font-mono">$${activeDeposit!.amount.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Daily Rate</span>
              <span class="text-green-400 font-mono">${activeDeposit!.earning_rate}%</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Daily Max</span>
              <span class="text-white font-mono">$${(activeDeposit!.amount * activeDeposit!.earning_rate / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>` : `
        <div class="card p-5 border border-dashed border-white/15 text-center">
          <div class="text-4xl mb-3">💰</div>
          <h3 class="font-semibold text-white text-sm mb-1">No Active Plan</h3>
          <p class="text-gray-500 text-xs mb-4">Deposit to unlock daily spins and earnings</p>
          <a href="/user/deposit" class="btn-gold text-xs py-2.5 w-full">Deposit & Play</a>
        </div>`}

        <!-- Quick Actions -->
        <div class="card p-4 space-y-2">
          <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Quick Actions</p>
          <a href="/user/deposit" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-base">💰</div>
            <div class="flex-1">
              <p class="text-sm font-medium text-white">Add Funds</p>
              <p class="text-xs text-gray-500">Deposit more money</p>
            </div>
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
          <a href="/user/withdraw" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-base">🏧</div>
            <div class="flex-1">
              <p class="text-sm font-medium text-white">Withdraw</p>
              <p class="text-xs text-gray-500">Cash out earnings</p>
            </div>
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
          <a href="/user/referrals" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-base">👥</div>
            <div class="flex-1">
              <p class="text-sm font-medium text-white">Invite Friends</p>
              <p class="text-xs text-gray-500">Earn referral bonus</p>
            </div>
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>

        <!-- Spin History -->
        <div class="card p-4">
          <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Recent Spins</p>
          <div>${spinHistory}</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // ─── Wheel Canvas Drawing ────────────────────────────────────────────────
    const SEGMENTS = ${JSON.stringify(WHEEL_SEGMENTS)}
    const canvas = document.getElementById('wheel-canvas')
    const ctx = canvas.getContext('2d')
    let currentRotation = 0
    let isSpinning = false

    function drawWheel(rotation) {
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const r = cx - 4
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      SEGMENTS.forEach((seg, i) => {
        const startAngle = (i * 2 * Math.PI / SEGMENTS.length) + rotation
        const endAngle = ((i + 1) * 2 * Math.PI / SEGMENTS.length) + rotation

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, startAngle, endAngle)
        ctx.closePath()
        ctx.fillStyle = seg.color + (i % 2 === 0 ? 'dd' : 'aa')
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(startAngle + Math.PI / SEGMENTS.length)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 9px "JetBrains Mono", monospace'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 3
        ctx.fillText(seg.label, r - 8, 3)
        ctx.restore()
      })

      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(245,158,11,0.6)'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.1, 0, 2 * Math.PI)
      ctx.fillStyle = '#090e14'
      ctx.fill()
    }

    drawWheel(currentRotation)

    // ─── Spin Logic ──────────────────────────────────────────────────────────
    async function doSpin() {
      if (isSpinning) return
      isSpinning = true
      const btn = document.getElementById('spin-btn')
      if (btn) { btn.disabled = true; btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Spinning...' }
      document.getElementById('spin-result').classList.add('hidden')

      try {
        const res = await fetch('/api/spin', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        const data = await res.json()

        if (!res.ok || data.error) {
          showResult(false, null, data.error || 'Spin failed. Try again.')
          isSpinning = false
          if (btn) { btn.disabled = false; btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>SPIN NOW · $0.50' }
          return
        }

        const targetSegment = data.segment_index
        const segmentAngle = 2 * Math.PI / SEGMENTS.length
        const targetAngle = -(targetSegment * segmentAngle + segmentAngle / 2)
        const extraSpins = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI
        const finalRotation = currentRotation + extraSpins + (targetAngle - (currentRotation % (2 * Math.PI)))

        animateWheel(currentRotation, finalRotation, 4000, () => {
          currentRotation = finalRotation
          showResult(data.multiplier > 0, data, null)
          isSpinning = false
          if (data.spins_left !== undefined && data.spins_left <= 0) {
            if (btn) { btn.disabled = true; btn.textContent = '⏳ Come Back Tomorrow' }
          } else if (btn) {
            btn.disabled = false
            btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>SPIN NOW · $0.50'
          }
          setTimeout(() => location.reload(), 2500)
        })
      } catch (e) {
        showResult(false, null, 'Network error. Please try again.')
        isSpinning = false
        if (btn) btn.disabled = false
      }
    }

    function animateWheel(from, to, duration, onDone) {
      const start = performance.now()
      function frame(now) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const rotation = from + (to - from) * eased
        drawWheel(rotation)
        if (progress < 1) requestAnimationFrame(frame)
        else { drawWheel(to); onDone() }
      }
      requestAnimationFrame(frame)
    }

    function showResult(won, data, error) {
      const el = document.getElementById('spin-result')
      const text = document.getElementById('result-text')
      const sub = document.getElementById('result-sub')
      el.classList.remove('hidden', 'bg-green-500/10', 'border-green-500/30', 'bg-red-500/10', 'border-red-500/30', 'bg-red-900/10', 'border-red-900/30')
      if (error) {
        el.classList.add('bg-red-900/10', 'border-red-900/30', 'border')
        text.innerHTML = '<span class="text-red-400">❌ ' + error + '</span>'
        sub.textContent = ''
      } else if (won) {
        el.classList.add('bg-green-500/10', 'border-green-500/30', 'border')
        text.innerHTML = '<span class="text-green-400">🎉 You Won $' + data.earning.toFixed(2) + '!</span>'
        sub.textContent = data.multiplier + 'x multiplier · Net: $' + data.net.toFixed(2)
      } else {
        el.classList.add('bg-red-500/10', 'border-red-500/30', 'border')
        text.innerHTML = '<span class="text-red-400">😔 Better Luck Next Time</span>'
        sub.textContent = 'Spin fee: -$0.50 · Keep spinning!'
      }
    }

    function updateCountdown() {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const diff = tomorrow - now
      if (diff <= 0) { location.reload(); return }
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      const el = document.getElementById('countdown')
      if (el) el.innerText =
        hours.toString().padStart(2, '0') + ':' +
        minutes.toString().padStart(2, '0') + ':' +
        seconds.toString().padStart(2, '0')
    }
    setInterval(updateCountdown, 1000)
    updateCountdown()

    // ─── Live Payout Feed ────────────────────────────────────────────────────
    async function loadPayouts() {
      try {
        const res = await fetch('/api/payouts/recent')
        if (!res.ok) return
        const { payouts } = await res.json()
        if (!payouts || !payouts.length) {
          document.getElementById('payout-feed').innerHTML =
            '<p class="text-center text-gray-600 text-xs py-6">No payouts yet — be the first!</p>'
          return
        }

        document.getElementById('payout-feed').innerHTML = payouts.map(p => \`
          <div class="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
            <div class="w-9 h-9 rounded-full bg-green-500/15 border border-green-500/30
                        flex items-center justify-center text-base flex-shrink-0 select-none">
              \${p.flag}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate">\${p.name}</p>
              <p class="text-xs text-gray-500">\${p.time}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-bold text-green-400 font-mono">+$\${p.amount}</p>
              <p class="text-xs text-gray-600">paid out</p>
            </div>
            <div class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0"></div>
          </div>
        \`).join('')
      } catch (e) { /* silent — skeletons stay */ }
    }

    loadPayouts()
  </script>`, {
    title: 'Dashboard – SpinVault',
    description: 'Spin the wheel and earn real money every day.',
    activePage: 'dashboard',
    userName: user.full_name,
    userBalance: wallet.balance,
  })
}

function buildWheelSVG(): string {
  return ''
}
