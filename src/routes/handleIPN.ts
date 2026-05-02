/* ================= PayFast Callback Handler (IPN Only) ================= */
import { PayFastProcessor } from './PayFastCall'
import type { Env } from '../types'

export async function handlePayFastIPN( request: Request, env: Env, DB: D1Database ): Promise<Response> {
  // ✅ Add this back - IPN should only be POST
  if (request.method !== 'POST') {
    return new Response("Method not allowed", { status: 405 });
  }
  
  const body = await request.text();
  const req: Record<string, string> = {};
  new URLSearchParams(body).forEach((value, key) => { req[key] = value; });
  
  const requiredParams = ['basket_id', 'err_code', 'validation_hash', 'transaction_id', 'transaction_currency', 'transaction_amount', 'PaymentName'];
  for (const param of requiredParams) {
    if (!req[param]) {
      return new Response(`Missing parameter: ${param}`, { status: 400 });
    }
  }
  
  if (!await PayFastProcessor.validateCallback(env, {
    order_id: req.basket_id,
    err_code: req.err_code,
    validation_hash: req.validation_hash,
    transaction_id: req.transaction_id
  })) {
    return new Response("Invalid callback signature", { status: 400 });
  }
  
  const orderId = req.basket_id;
  const transactionId = req.transaction_id;
  const callbackAmount = parseFloat(req.transaction_amount);
  
  const issuerName = req.issuer_name || 'Unknown Issuer';
  const paymentMethod = `${req.PaymentName} (${issuerName})`;
  const status = req.err_code === '000' ? 'completed' : 'failed';

  if (status === 'completed') {
    const result = await DB.prepare(`
      UPDATE deposits 
      SET status = 'confirmed', 
      transaction_ref = ?, 
      payment_method = ?, 
      updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ? AND status = 'pending'
      RETURNING id, plan_id, amount, user_id;
    `).bind(transactionId, paymentMethod, orderId).first<any>();

    if (!result) {
      throw new Error("Deposit not found");
    }

    if (callbackAmount !== result.amount) {
      throw new Error(`Amount mismatch: expected ${result.amount}, got ${callbackAmount}`);
    }

    const plan = await DB.prepare(`
      SELECT daily_spins FROM plans WHERE id = ?
    `).bind(result.plan_id).first<any>();

    if (!plan) {
      throw new Error(`Plan ${result.plan_id} not found`);
    }

    await DB.prepare(`
      UPDATE user_wallets
      SET balance = balance + ?, 
      total_deposited = total_deposited + ?,
      spins_left = spins_left + ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(result.amount, result.amount, plan.daily_spins, result.user_id).run();
  }
  
  return new Response("OK", { status: 200 });
}
