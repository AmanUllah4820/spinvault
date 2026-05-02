import type { Context } from 'hono'
import type { Env } from '../../types'
import { layout } from '../layout'

export async function HandleSuccess(c: Context<{ Bindings: Env }>): Promise<Response> {
  const q = c.req.query()
  return c.html(resultPage({
    success: true,
    errCode: q.err_code || '000',
    errMsg: q.err_msg || 'Success',
    transactionId: q.transaction_id || '',
    basketId: q.basket_id || '',
    paymentName: q.PaymentName || '',
    issuerName: q.issuer_name || '',
    amount: q.transaction_amount || '',
    currency: q.transaction_currency || '',
  }))
}

export async function HandleFailure(c: Context<{ Bindings: Env }>): Promise<Response> {
  const q = c.req.query()
  return c.html(resultPage({
    success: false,
    errCode: q.err_code || '',
    errMsg: q.err_msg || 'Payment Failed',
    transactionId: q.transaction_id || '',
    basketId: q.basket_id || '',
    paymentName: q.PaymentName || '',
    issuerName: q.issuer_name || '',
    amount: q.transaction_amount || '',
    currency: q.transaction_currency || '',
  }))
}

function resultPage(d: {
  success: boolean
  errCode: string
  errMsg: string
  transactionId: string
  basketId: string
  paymentName: string
  issuerName: string
  amount: string
  currency: string
}): string {
  const { success } = d
  const title     = success ? 'Payment Successful' : 'Payment Failed'
  const sub       = success
    ? 'Your deposit is confirmed. Your spins are ready!'
    : 'Transaction could not be completed. No funds were deducted.'
  const borderCls = success ? 'border-green-500/30' : 'border-red-500/30'
  const bgCls     = success ? 'bg-green-500/10'     : 'bg-red-500/10'

  const rows: [string, string][] = [
    ['Transaction ID', d.transactionId || '—'],
    ['Order / Basket', d.basketId      || '—'],
    ['Payment',        d.paymentName   || '—'],
    ['Issuer',         d.issuerName    || '—'],
    ['Amount',         d.amount ? `${d.currency} ${d.amount}` : '—'],
    ['Status',         `${d.errCode} – ${d.errMsg}`],
  ]

  return layout(`
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md animate-slide-up">
      <div class="card p-8 border ${borderCls} text-center">
        <h1 class="font-display text-2xl font-bold text-white mb-2">${title}</h1>
        <p class="text-gray-400 text-sm mb-8">${sub}</p>
        <div class="${bgCls} border ${borderCls} rounded-xl p-4 mb-8 text-left space-y-2">
          ${rows.map(([label, value]) => `
          <div class="flex justify-between text-xs gap-4">
            <span class="text-gray-500 uppercase tracking-wide shrink-0">${label}</span>
            <span class="font-mono text-gray-200 text-right break-all">${value}</span>
          </div>`).join('')}
        </div>
        <div class="flex flex-col gap-3">
          ${success
            ? `<a href="/user/dashboard" class="btn-gold py-3">🎰 Start Spinning</a>
               <a href="/user/dashboard" class="btn-outline py-3">Dashboard</a>`
            : `<a href="/user/deposit" class="btn-gold py-3">Try Again</a>
               <a href="/user/dashboard" class="btn-outline py-3">Dashboard</a>`
          }
        </div>
      </div>
    </div>
  </div>
  `, { title: `${title} – SpinVault` })
}
