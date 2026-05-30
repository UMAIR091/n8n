"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface InitialSettings {
  emailEnabled: boolean;
  emailRecipients: string[];
  whatsappEnabled: boolean;
  whatsappRecipients: string[];
  minAmountThreshold: number;
  smsEnabled?: boolean;
  smsRecipients?: string[];
}

interface NotificationSettingsProps {
  orgId?: string;
  initial?: InitialSettings;
  // Legacy props
  settings?: { emailEnabled: boolean; emailRecipients: string[]; whatsappEnabled: boolean; whatsappRecipients: string[]; minAmountThreshold: number } | null;
  onSave?: (s: Partial<InitialSettings>) => Promise<void>;
}

export function NotificationSettings({
  orgId,
  initial,
  settings,
  onSave,
}: NotificationSettingsProps) {
  const defaults = initial || settings || {
    emailEnabled: true,
    emailRecipients: [],
    whatsappEnabled: false,
    whatsappRecipients: [],
    minAmountThreshold: 0,
  };

  const [emailEnabled, setEmailEnabled] = useState(defaults.emailEnabled);
  const [emailRecipients, setEmailRecipients] = useState<string[]>(defaults.emailRecipients);
  const [whatsappEnabled, setWhatsappEnabled] = useState(defaults.whatsappEnabled);
  const [whatsappRecipients, setWhatsappRecipients] = useState<string[]>(defaults.whatsappRecipients);
  const [minAmount, setMinAmount] = useState((defaults.minAmountThreshold ?? 0) / 100);
  const [newEmail, setNewEmail] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const addEmail = () => {
    if (!newEmail.includes("@")) return;
    if (!emailRecipients.includes(newEmail)) {
      setEmailRecipients([...emailRecipients, newEmail]);
    }
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    setEmailRecipients(emailRecipients.filter((e) => e !== email));
  };

  const addWhatsapp = () => {
    if (!newWhatsapp.startsWith("+")) {
      setError("WhatsApp number must start with + (e.g. +14155238886)");
      return;
    }
    if (!whatsappRecipients.includes(newWhatsapp)) {
      setWhatsappRecipients([...whatsappRecipients, newWhatsapp]);
    }
    setNewWhatsapp("");
    setError("");
  };

  const removeWhatsapp = (num: string) => {
    setWhatsappRecipients(whatsappRecipients.filter((n) => n !== num));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        emailEnabled,
        emailRecipients,
        whatsappEnabled,
        whatsappRecipients,
        smsEnabled: false,
        smsRecipients: [],
        minAmountThreshold: Math.round(minAmount * 100),
      };

      if (onSave) {
        await onSave(payload);
      } else {
        const res = await fetch("/api/notifications/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save");
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure how and when you receive payment failure alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Minimum Amount */}
        <div className="space-y-2">
          <Label htmlFor="min-amount">Minimum Failure Amount (USD)</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input
              id="min-amount"
              type="number"
              min="0"
              step="0.01"
              value={minAmount}
              onChange={(e) => setMinAmount(parseFloat(e.target.value) || 0)}
              className="w-32"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Only notify for failures at or above this amount. Set to $0 for all failures.
          </p>
        </div>

        {/* Email */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">Via Resend</p>
            </div>
            <button
              onClick={() => setEmailEnabled(!emailEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {emailEnabled && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {emailRecipients.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1 pr-1">
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="team@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEmail()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">WhatsApp Notifications</h3>
              <p className="text-sm text-muted-foreground">Via Twilio</p>
            </div>
            <button
              onClick={() => setWhatsappEnabled(!whatsappEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                whatsappEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  whatsappEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {whatsappEnabled && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {whatsappRecipients.map((num) => (
                  <Badge key={num} variant="secondary" className="flex items-center gap-1 pr-1">
                    {num}
                    <button
                      onClick={() => removeWhatsapp(num)}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="+14155238886"
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWhatsapp()}
                  className="flex-1 font-mono"
                />
                <Button variant="outline" size="icon" onClick={addWhatsapp}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
