import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface PaymentFailureEmailData {
  customerName?: string;
  customerEmail: string;
  amount: number;
  currency: string;
  failureReason: string;
  failureCode?: string;
  paymentMethodType?: string;
  paymentMethodLast4?: string;
  productName?: string;
  invoiceUrl?: string;
  organizationName: string;
  occurredAt: Date;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function buildPaymentFailureHtml(data: PaymentFailureEmailData): string {
  const formattedAmount = formatCurrency(data.amount, data.currency);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data.occurredAt));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Failed — ${data.organizationName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #111827; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; }
    .header h1 { color: white; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 4px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: white; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-top: 12px; }
    .content { padding: 40px; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; }
    .alert-box .label { font-size: 12px; font-weight: 600; color: #dc2626; text-transform: uppercase; letter-spacing: 0.05em; }
    .alert-box .reason { font-size: 15px; color: #7f1d1d; margin-top: 4px; line-height: 1.5; }
    .section-title { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .info-card .card-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .info-card .card-value { font-size: 16px; font-weight: 600; color: #111827; }
    .info-card .card-value.amount { font-size: 22px; color: #dc2626; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 14px; color: #6b7280; }
    .detail-value { font-size: 14px; font-weight: 500; color: #111827; }
    .cta { text-align: center; margin-top: 32px; }
    .btn { display: inline-block; background: #111827; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .btn-secondary { display: inline-block; background: transparent; color: #6b7280; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; border: 1px solid #e5e7eb; margin-left: 12px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 13px; color: #9ca3af; line-height: 1.6; }
    .footer a { color: #6b7280; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>⚠️ Payment Failed</h1>
      <p>A payment has failed and requires your attention</p>
      <span class="badge">ACTION REQUIRED</span>
    </div>
    <div class="content">
      <div class="alert-box">
        <div class="label">Failure Reason</div>
        <div class="reason">${data.failureReason}</div>
      </div>

      <div class="section-title">Payment Details</div>
      <div class="info-grid">
        <div class="info-card">
          <div class="card-label">Amount Failed</div>
          <div class="card-value amount">${formattedAmount}</div>
        </div>
        <div class="info-card">
          <div class="card-label">Customer</div>
          <div class="card-value">${data.customerName || data.customerEmail}</div>
        </div>
      </div>

      <div class="section-title">Transaction Information</div>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px 16px; margin-bottom: 28px;">
        <div class="detail-row">
          <span class="detail-label">Customer Email</span>
          <span class="detail-value">${data.customerEmail}</span>
        </div>
        ${data.productName ? `<div class="detail-row"><span class="detail-label">Product</span><span class="detail-value">${data.productName}</span></div>` : ""}
        ${
          data.paymentMethodType || data.paymentMethodLast4
            ? `<div class="detail-row"><span class="detail-label">Payment Method</span><span class="detail-value">${data.paymentMethodType || "Card"}${data.paymentMethodLast4 ? ` ending in ${data.paymentMethodLast4}` : ""}</span></div>`
            : ""
        }
        ${data.failureCode ? `<div class="detail-row"><span class="detail-label">Failure Code</span><span class="detail-value">${data.failureCode}</span></div>` : ""}
        <div class="detail-row">
          <span class="detail-label">Occurred At</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Organization</span>
          <span class="detail-value">${data.organizationName}</span>
        </div>
      </div>

      <div class="cta">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/failures" class="btn">View in Dashboard</a>
        ${data.invoiceUrl ? `<a href="${data.invoiceUrl}" class="btn-secondary">View Invoice</a>` : ""}
      </div>
    </div>
    <div class="footer">
      <p>This alert was sent by <strong>Recoverly</strong> on behalf of <strong>${data.organizationName}</strong>.<br />
      You're receiving this because you're configured as a notification recipient.<br />
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings">Manage notification settings</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPaymentFailureEmail(
  recipients: string[],
  data: PaymentFailureEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const html = buildPaymentFailureHtml(data);
    const subject = `⚠️ Payment Failed: ${formatCurrency(data.amount, data.currency)} from ${data.customerName || data.customerEmail}`;

    const result = await resend.emails.send({
      from: `Recoverly Alerts <alerts@recoverly.io>`,
      to: recipients,
      subject,
      html,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send payment failure notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
