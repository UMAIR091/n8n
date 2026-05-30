"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ExternalLink, CheckCircle } from "lucide-react";

interface StripeConnectProps {
  webhookUrl: string;
  isConnected?: boolean;
  liveMode?: boolean;
  // Legacy props
  organizationId?: string;
  hasWebhookSecret?: boolean;
}

export function StripeConnect({
  webhookUrl,
  isConnected,
  liveMode,
  hasWebhookSecret,
}: StripeConnectProps) {
  const connected = isConnected ?? hasWebhookSecret ?? false;
  const [copied, setCopied] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!webhookSecret.trim()) {
      setError("Webhook secret is required");
      return;
    }
    if (!webhookSecret.startsWith("whsec_")) {
      setError("Webhook secret must start with 'whsec_'");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/organizations/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookSecret }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSaved(true);
      setWebhookSecret("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Webhook Integration</CardTitle>
        <CardDescription>
          Connect your Stripe account by configuring the webhook endpoint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection status */}
        {connected && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              Stripe webhook connected
              {liveMode ? " (Live mode)" : " (Test mode)"}
            </span>
          </div>
        )}

        {/* Step 1: Webhook URL */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </div>
            <h3 className="font-medium">Copy your webhook endpoint URL</h3>
          </div>
          <div className="flex items-center gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Step 2: Configure in Stripe */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </div>
            <h3 className="font-medium">Add to Stripe Dashboard</h3>
          </div>
          <a
            href="https://dashboard.stripe.com/webhooks/create"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Open Stripe Webhooks
            <ExternalLink className="h-3 w-3" />
          </a>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium mb-2">Listen for these events:</p>
            <ul className="space-y-1 text-sm text-muted-foreground font-mono">
              <li>• payment_intent.payment_failed</li>
              <li>• invoice.payment_failed</li>
              <li>• customer.subscription.updated</li>
            </ul>
          </div>
        </div>

        {/* Step 3: Enter webhook secret */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </div>
            <h3 className="font-medium">
              {connected ? "Update webhook signing secret" : "Enter webhook signing secret"}
            </h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Signing Secret</Label>
            <Input
              id="webhook-secret"
              type="password"
              placeholder="whsec_..."
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="font-mono"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved!" : connected ? "Update Secret" : "Save Webhook Secret"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
