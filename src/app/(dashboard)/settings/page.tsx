import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StripeConnect } from "@/components/settings/StripeConnect";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { generateWebhookEndpoint } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await auth();
  const orgId = (session?.user as Record<string, unknown>)?.organizationId as string;
  const orgSlug = (session?.user as Record<string, unknown>)?.organizationSlug as string;

  const [stripeConn, notifSettings, org] = await Promise.all([
    prisma.stripeConnection.findUnique({ where: { organizationId: orgId } }),
    prisma.notificationSetting.findUnique({ where: { organizationId: orgId } }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, slug: true, plan: true } }),
  ]);

  const webhookUrl = generateWebhookEndpoint(orgSlug);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">
          Workspace: <span className="font-medium">{org?.name}</span> · Plan:{" "}
          <span className="font-medium">{org?.plan}</span>
        </p>
      </div>

      <StripeConnect
        webhookUrl={webhookUrl}
        isConnected={!!stripeConn}
        liveMode={stripeConn?.liveMode ?? false}
      />

      <NotificationSettings
        orgId={orgId}
        initial={{
          emailEnabled: notifSettings?.emailEnabled ?? true,
          emailRecipients: notifSettings?.emailRecipients ?? [],
          whatsappEnabled: notifSettings?.whatsappEnabled ?? false,
          whatsappRecipients: notifSettings?.whatsappRecipients ?? [],
          minAmountThreshold: notifSettings?.minAmountThreshold ?? 0,
        }}
      />
    </div>
  );
}
