import { layout } from './layout'

export function homePage(): string {
  return layout(`
  <!-- Hero Section -->
  <section class="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
    <!-- Animated circles -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-pulse-gold pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-600/8 rounded-full blur-3xl pointer-events-none" style="animation-delay:1s"></div>

    <div class="relative z-10 max-w-3xl mx-auto animate-slide-up">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/30 mb-6">
        <span class="text-gold-400 text-xs font-semibold tracking-wide uppercase">🎰 Live Platform</span>
        <div class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
        <span class="text-green-400 text-xs font-medium">Winners Paid Daily</span>
      </div>

      <h1 class="font-display text-5xl md:text-7xl font-black text-white leading-tight mb-4">
        Spin. Win.<br>
        <span class="text-gradient">Get Paid.</span>
      </h1>
      <p class="text-lg md:text-xl text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
        The premier online spin-and-win platform where real money meets real excitement.
        Deposit, spin daily, and withdraw your earnings.
      </p>

      <div class="flex flex-col sm:flex-row gap-3 justify-center mb-12">
        <a href="/register" class="btn-gold px-8 py-4 text-base shadow-2xl shadow-gold-500/20">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Start Winning Free
        </a>
        <a href="#how-it-works" class="btn-outline px-8 py-4 text-base">
          How It Works →
        </a>
      </div>

      <!-- Live stats ticker -->
      <div class="flex flex-wrap justify-center gap-6 text-sm">
        <div class="flex items-center gap-2 text-gray-400">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span><strong class="text-white">2,847</strong> Players Online</span>
        </div>
        <div class="text-gray-600">|</div>
        <div class="flex items-center gap-2 text-gray-400">
          <span class="text-gold-400">💰</span>
          <span><strong class="text-white">$142,392</strong> Paid This Month</span>
        </div>
        <div class="text-gray-600">|</div>
        <div class="flex items-center gap-2 text-gray-400">
          <span>🏆</span>
          <span><strong class="text-white">98.3%</strong> Payout Rate</span>
        </div>
      </div>
    </div>

    <!-- Floating Wheel Preview -->
    <div class="mt-16 relative animate-float">
      <div class="w-48 h-48 rounded-full border-4 border-gold-500/40 shadow-2xl shadow-gold-500/20 overflow-hidden mx-auto relative">
        <canvas id="preview-wheel" width="192" height="192"></canvas>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-12 h-12 rounded-full bg-dark-400 border-4 border-gold-500 flex items-center justify-center text-2xl shadow-lg">🎰</div>
        </div>
      </div>
      <div class="absolute -top-2 left-1/2 -translate-x-1/2">
        <div style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:20px solid #f59e0b;"></div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section id="how-it-works" class="py-20 px-4">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-12">
        <h2 class="font-display text-3xl md:text-4xl font-bold text-white mb-3">How It Works</h2>
        <p class="text-gray-400">Get started in minutes. No experience needed.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        ${[
          { icon: '📝', step: '01', title: 'Register', desc: 'Create your free account in under 2 minutes.' },
          { icon: '💰', step: '02', title: 'Deposit', desc: 'Choose a plan starting from just $1.' },
          { icon: '🎰', step: '03', title: 'Spin Daily', desc: 'Use your daily spins to win multipliers.' },
          { icon: '🏧', step: '04', title: 'Withdraw', desc: 'Cash out to your bank account anytime.' },
        ].map((s, i) => `
        <div class="relative card p-6 text-center hover:-translate-y-1 transition-all duration-300">
          ${i < 3 ? `<div class="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-gold-500/50 to-transparent z-10"></div>` : ''}
          <div class="text-xs font-mono text-gold-500/60 mb-3 tracking-widest">${s.step}</div>
          <div class="text-4xl mb-3">${s.icon}</div>
          <h3 class="font-display font-bold text-white mb-2">${s.title}</h3>
          <p class="text-gray-400 text-sm">${s.desc}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Plans Preview -->
  <section class="py-20 px-4 bg-gradient-to-b from-transparent via-dark-300/30 to-transparent">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-12">
        <h2 class="font-display text-3xl md:text-4xl font-bold text-white mb-3">Investment Plans</h2>
        <p class="text-gray-400">Plans for every budget — start as low as $1</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        ${[
          { name: 'Starter', deposit: '$1–$9', rate: '1.5%', icon: '🎯', spins: 3 },
          { name: 'Basic',   deposit: '$10–$49', rate: '2.0%', icon: '💎', spins: 5 },
          { name: 'Silver',  deposit: '$50–$99', rate: '2.5%', icon: '⭐', spins: 8 },
          { name: 'Gold',    deposit: '$100–$249', rate: '3.0%', icon: '🏆', spins: 12, popular: true },
          { name: 'Premium', deposit: '$250–$500', rate: '4.0%', icon: '👑', spins: 20 },
        ].map(p => `
        <div class="card p-4 text-center hover:border-gold-500/30 transition-all duration-300 ${p.popular ? 'border-gold-500/40' : ''}">
          ${p.popular ? '<div class="text-xs text-gold-400 font-semibold mb-1">⭐ Popular</div>' : '<div class="mb-4"></div>'}
          <div class="text-3xl mb-2">${p.icon}</div>
          <h3 class="font-semibold text-white text-sm">${p.name}</h3>
          <p class="text-xs text-gray-500 mt-0.5">${p.deposit}</p>
          <p class="text-green-400 font-bold text-sm mt-2">${p.rate}/day</p>
          <p class="text-xs text-gray-600">${p.spins} spins</p>
        </div>`).join('')}
      </div>
      <div class="text-center mt-8">
        <a href="/register" class="btn-gold px-8 py-3.5">Get Started Free →</a>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="py-20 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-12">
        <h2 class="font-display text-3xl font-bold text-white mb-3">What Winners Say</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${[
          { name: 'Ahmed K.', country: '🇵🇰', text: 'Withdrew $340 last month. The Gold plan gives amazing returns daily. Highly recommend!', stars: 5, plan: 'Gold' },
          { name: 'Sarah M.', country: '🇺🇸', text: 'Been using for 3 months. Consistent daily earnings and quick withdrawals to my bank.', stars: 5, plan: 'Premium' },
          { name: 'Raj P.', country: '🇮🇳', text: 'Started with $10 Basic plan. Now upgraded to Silver after seeing great results!', stars: 4, plan: 'Silver' },
        ].map(t => `
        <div class="card p-5">
          <div class="flex items-center gap-1 mb-3">
            ${'★'.repeat(t.stars)}<span class="text-gray-600">${'★'.repeat(5-t.stars)}</span>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed mb-4">"${t.text}"</p>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-400 font-bold text-xs">
              ${t.name[0]}
            </div>
            <div>
              <p class="text-sm font-semibold text-white">${t.name} ${t.country}</p>
              <p class="text-xs text-gray-500">${t.plan} Plan Member</p>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-20 px-4">
    <div class="max-w-2xl mx-auto text-center">
      <div class="card p-10 border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent">
        <div class="text-5xl mb-4 animate-float">🎰</div>
        <h2 class="font-display text-3xl font-bold text-white mb-3">Ready to Start Winning?</h2>
        <p class="text-gray-400 mb-6">Join thousands of players earning daily. Registration is free and takes under 2 minutes.</p>
        <a href="/register" class="btn-gold px-10 py-4 text-base shadow-2xl shadow-gold-500/20">
          Create Free Account →
        </a>
        <p class="mt-4 text-xs text-gray-600">No credit card required · Instant signup · Withdraw anytime</p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-white/5 py-10 px-4">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-lg">🎰</div>
          <span class="font-display font-bold text-white">Spin<span class="text-gradient">Vault</span></span>
        </div>
        <nav class="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <a href="/terms" class="hover:text-gold-400 transition-colors">Terms</a>
          <a href="/privacy" class="hover:text-gold-400 transition-colors">Privacy</a>
          <a href="/faq" class="hover:text-gold-400 transition-colors">FAQ</a>
          <a href="/contact" class="hover:text-gold-400 transition-colors">Contact</a>
        </nav>
        <p class="text-xs text-gray-600">© ${new Date().getFullYear()} SpinVault. All rights reserved.</p>
      </div>
      <p class="text-center text-xs text-gray-700 mt-6">
        SpinVault is an entertainment platform. Please play responsibly. Must be 18+ to participate.
      </p>
    </div>
  </footer>

  <script>
    // Preview wheel animation on homepage
    const canvas = document.getElementById('preview-wheel')
    if (canvas) {
      const ctx = canvas.getContext('2d')
      const colors = ['#ef4444','#f97316','#22c55e','#3b82f6','#a855f7','#f59e0b','#ef4444','#ec4899']
      let rot = 0
      function drawPreview() {
        const cx = 96, cy = 96, r = 88
        ctx.clearRect(0,0,192,192)
        colors.forEach((c, i) => {
          const sa = (i * 2 * Math.PI / colors.length) + rot
          const ea = ((i + 1) * 2 * Math.PI / colors.length) + rot
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.arc(cx, cy, r, sa, ea)
          ctx.closePath()
          ctx.fillStyle = c + (i%2===0?'cc':'88')
          ctx.fill()
          ctx.strokeStyle='rgba(0,0,0,0.2)'
          ctx.lineWidth=1
          ctx.stroke()
        })
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, 2*Math.PI)
        ctx.strokeStyle='rgba(245,158,11,0.5)'
        ctx.lineWidth=3
        ctx.stroke()
        rot += 0.008
        requestAnimationFrame(drawPreview)
      }
      drawPreview()
    }
  </script>`,
  {
    title: 'SpinVault – Spin the Wheel, Win Real Money',
    description: 'Join SpinVault and earn real money daily by spinning the wheel. Plans from $1. Instant withdrawals.',
  })
}
