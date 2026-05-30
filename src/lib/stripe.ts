import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
  typescript: true,
});

export async function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

const DECLINE_CODE_MAP: Record<string, string> = {
  authentication_required:
    "Card authentication required — customer must complete 3D Secure",
  approve_with_id: "Payment cannot be authorized without identification",
  call_issuer: "Card declined — customer should call their bank",
  card_not_supported: "Card does not support this type of purchase",
  card_velocity_exceeded:
    "Card spending limit exceeded — customer should use a different card",
  currency_not_supported: "Card does not support this currency",
  do_not_honor: "Card declined by issuer — customer should contact their bank",
  do_not_try_again:
    "Card permanently declined — customer should use a different card",
  duplicate_transaction: "Duplicate transaction detected",
  expired_card: "Card expired — customer needs to update their payment method",
  fraudulent: "Suspicious activity detected — card declined for security",
  generic_decline:
    "Card declined — customer should contact their bank for details",
  incorrect_number: "Incorrect card number",
  incorrect_cvc: "Incorrect CVC code — customer should verify and retry",
  incorrect_pin: "Incorrect PIN",
  incorrect_zip: "Incorrect ZIP/postal code",
  insufficient_funds:
    "Insufficient funds — customer should add funds or use a different card",
  invalid_account: "Invalid account — customer should contact their bank",
  invalid_amount: "Invalid amount",
  invalid_cvc: "Invalid CVC code",
  invalid_expiry_month: "Invalid expiry month",
  invalid_expiry_year: "Invalid expiry year",
  invalid_number: "Invalid card number",
  invalid_pin: "Invalid PIN",
  issuer_not_available: "Card issuer not available — please retry later",
  lost_card: "Card reported lost — customer must use a different payment method",
  merchant_blacklist: "Card declined by merchant restriction",
  new_account_information_available:
    "Card information updated — customer should retry with new card details",
  no_action_taken: "Card declined — no action taken by issuer",
  not_permitted: "Transaction not permitted",
  offline_pin_required: "Offline PIN required",
  online_or_offline_pin_required: "PIN required",
  pickup_card:
    "Card reported as pick up — customer must use a different payment method",
  pin_try_exceeded: "PIN attempts exceeded",
  processing_error:
    "Processing error — this is a temporary issue, please retry",
  reenter_transaction: "Please re-enter transaction details",
  restricted_card:
    "Card restricted — customer should contact their bank",
  revocation_of_all_authorizations:
    "Card authorization revoked — customer should use a different card",
  revocation_of_authorization:
    "Card authorization revoked for this merchant",
  security_violation: "Security violation — card declined",
  service_not_allowed: "Service not allowed for this card",
  stolen_card:
    "Card reported stolen — customer must use a different payment method",
  stop_payment_order: "Stop payment order on card",
  testmode_decline: "Test card declined (test mode)",
  transaction_not_allowed: "Transaction not allowed for this card",
  try_again_later: "Temporary issue — please retry later",
  withdrawal_count_limit_exceeded:
    "Withdrawal limit exceeded — customer should use a different card",
};

export function humanizeFailureReason(
  failureCode?: string | null,
  failureMessage?: string | null
): string {
  if (failureCode && DECLINE_CODE_MAP[failureCode]) {
    return DECLINE_CODE_MAP[failureCode];
  }

  if (failureMessage) {
    return failureMessage.charAt(0).toUpperCase() + failureMessage.slice(1);
  }

  return "Payment declined — please contact your bank or use a different payment method";
}

export function getPaymentMethodInfo(paymentMethod?: Stripe.PaymentMethod | null): {
  type: string;
  last4?: string;
} {
  if (!paymentMethod) return { type: "unknown" };

  const type = paymentMethod.type;

  if (type === "card" && paymentMethod.card) {
    return {
      type: `${paymentMethod.card.brand} card`,
      last4: paymentMethod.card.last4,
    };
  }

  return { type };
}
