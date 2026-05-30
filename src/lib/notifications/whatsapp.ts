import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

export interface WhatsAppPaymentFailureData {
  customerName?: string;
  customerEmail: string;
  amount: number;
  currency: string;
  failureReason: string;
  productName?: string;
  organizationName: string;
  dashboardUrl: string;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function buildWhatsAppMessage(data: WhatsAppPaymentFailureData): string {
  const formattedAmount = formatCurrency(data.amount, data.currency);
  const customer = data.customerName || data.customerEmail;

  const lines = [
    `⚠️ *Payment Failed — ${data.organizationName}*`,
    ``,
    `💰 *Amount:* ${formattedAmount}`,
    `👤 *Customer:* ${customer}`,
    `📧 *Email:* ${data.customerEmail}`,
    data.productName ? `📦 *Product:* ${data.productName}` : null,
    ``,
    `❌ *Reason:* ${data.failureReason}`,
    ``,
    `🔗 View in dashboard: ${data.dashboardUrl}`,
  ].filter((line) => line !== null);

  return lines.join("\n");
}

export async function sendPaymentFailureWhatsApp(
  recipients: string[],
  data: WhatsAppPaymentFailureData
): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
  const message = buildWhatsAppMessage(data);
  const messageIds: string[] = [];
  const errors: string[] = [];

  for (const recipient of recipients) {
    const to = recipient.startsWith("whatsapp:")
      ? recipient
      : `whatsapp:${recipient}`;

    try {
      const result = await client.messages.create({
        from: FROM,
        to,
        body: message,
      });
      messageIds.push(result.sid);
    } catch (error) {
      console.error(
        `[WhatsApp] Failed to send to ${recipient}:`,
        error
      );
      errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  if (messageIds.length === 0) {
    return {
      success: false,
      error: errors.join("; "),
    };
  }

  return { success: true, messageIds };
}
