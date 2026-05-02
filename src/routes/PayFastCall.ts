/* ================= PaymentFunctions.ts ================= */
import { sha256 } from '../utils/security'
import type { Env } from '../types'

export class PayFastProcessor {

  /**
   * Generate Access Token from PayFast API
   * (Exact replacement of PHP cURL logic)
   */
  static async generateToken(
    env: Env,
    TXNAMT: string,
    order_id: string,
    currency: string
  ): Promise<{ ACCESS_TOKEN: string }> {

    const params = new URLSearchParams({
      MERCHANT_ID: env.PAYFAST_MERCHANT_ID,
      SECURED_KEY: env.PAYFAST_SECURED_KEY,
      TXNAMT: TXNAMT,
      BASKET_ID: order_id,
      CURRENCY_CODE: currency,
    });

    const url = `${env.PayFast_BASE_URL}/Ecommerce/api/Transaction/GetAccessToken`;
    const xRequestId = await sha256(crypto.randomUUID() + Date.now());
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "MERCHANT-ID": env.PAYFAST_MERCHANT_ID,
        "STORE-ID": env.PAYFAST_STORE_ID,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Request-ID": xRequestId,
        "x-payfast-plugin-version": "WooCommerce_8_BlockCheckout",
        "User-Agent": "PayFast-PHP-Curl-Addon/1.0 (WooCommerce_BlockCheckout-WordPress/8+)",
      },
      body: params.toString(),
    });

    const text = await response.text();
    const parsed = JSON.parse(text);
    if (!parsed.ACCESS_TOKEN) {
      throw new Error("Failed to get PayFast token");
    }

    return {
      ACCESS_TOKEN: parsed.ACCESS_TOKEN,
    };
  }

  /**
   * Validate PayFast Callback
   * (Exact PHP logic preserved)
   */
  static async validateCallback(
    env: Env,
    callbackData: Record<string, string>
  ): Promise<boolean> {

    const required = [ "order_id", "err_code", "validation_hash", "transaction_id" ];

    for (const field of required) {
      if (!callbackData[field]) {
        return false;
      }
    }

    const GWebPayString = [
      callbackData.order_id,
      env.PAYFAST_SECURED_KEY,
      env.PAYFAST_MERCHANT_ID,
      callbackData.err_code
    ].join("|");

    // EXACT SHA256 (matches PHP)
    const GWebPayHash = await sha256(GWebPayString);
    return GWebPayHash === callbackData.validation_hash;
  }
}
