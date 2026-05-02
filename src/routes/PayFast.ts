import { sha256 } from '../utils/security'
import { GenOrderId } from '../utils/shared'
import { PayFastProcessor } from './PayFastCall'
import type { Env } from '../types'

export const payfastHandler = {
  async fetch(request: Request, env: Env) {
    const input = await request.json() as {
      amount: number
      customer_id: number
      customer_email: string
      customer_phone: string
      name: string
      customer_address: string
      description: string
      order_id: number
    }

    const order_id = input.order_id.toString()
    const TXNAMT     = Number(input.amount).toFixed(2)
    const OrderDate  = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const signature  = await sha256(order_id)
    const currency   = 'USD'

    // ── Token from PayFast ─────────────────────────────────────────────────
    const { ACCESS_TOKEN } = await PayFastProcessor.generateToken(
      env, TXNAMT, order_id, currency );    

    const payload = new URLSearchParams({
      MERCHANT_ID: env.PAYFAST_MERCHANT_ID,
      MERCHANT_NAME: 'SpinVault',
      TOKEN: ACCESS_TOKEN,
      PROCCODE: "00",
      TXNAMT: TXNAMT,
      CUSTOMER_MOBILE_NO:     input.customer_phone,
      CUSTOMER_EMAIL_ADDRESS: input.customer_email,
      SIGNATURE: signature,
      PLUGIN_VERSION: "WOOCOM-BLOCK-CO-GOPAYFAST-8+",
      TXNDESC: input.description,
      SUCCESS_URL: `${env.APP_URL}/payment/success`,
      FAILURE_URL: `${env.APP_URL}/payment/invalid`,
      BASKET_ID: order_id,
      ORDER_DATE: OrderDate,
      CHECKOUT_URL: `${env.APP_URL}/payment/handleIPN?order_id=${order_id}`,
      TRAN_TYPE: "ECOMM_PURCHASE",
      STORE_ID: env.PAYFAST_STORE_ID,
      CURRENCY_CODE: currency
    })

    const paymentUrl = `${env.PayFast_BASE_URL}/Ecommerce/api/Transaction/PostTransaction`
    const inputFields: string[] = []
    payload.forEach((v, k) => {
      inputFields.push(`<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`)
    })

    const redirectPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${paymentUrl}">
  <title>Redirecting to PayFast...</title>
</head>
<body style="display:none;">
  <form id="payForm" method="POST" action="${paymentUrl}">
    ${inputFields.join('\n    ')}
  </form>
  <script>document.getElementById('payForm').submit();</script>
</body>
</html>`

    return new Response(redirectPage, {
      headers: {
        'Content-Type':           'text/html',
        'X-Frame-Options':        'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control':          'no-store',
      },
      status: 200,
    })
  },
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
