"use client";

import { useCallback, useEffect, useState } from "react";
import { Key, Save } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Field, Input } from "@/src/components/ui/Field";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

interface IntegrationRow {
  id: string;
  provider: string;
  config: Record<string, unknown>;
}

const providers = [
  {
    id: "openai",
    label: "OpenAI",
    fields: [{ key: "apiKey", label: "API Key", secret: true }],
  },
  {
    id: "twilio",
    label: "Twilio",
    fields: [
      { key: "accountSid", label: "Account SID", secret: false },
      { key: "authToken", label: "Auth Token", secret: true },
      { key: "fromNumber", label: "From Number", secret: false },
    ],
  },
  {
    id: "samsara",
    label: "Samsara",
    fields: [{ key: "apiToken", label: "API Token", secret: true }],
  },
] as const;

export default function IntegrationsSettingsPage() {
  const toast = useToast();
  const [integrations, setIntegrations] = useState<IntegrationRow[] | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ integrations: IntegrationRow[] }>("/api/integrations")
      .then(({ integrations: rows }) => {
        setIntegrations(rows);
        const initial: Record<string, Record<string, string>> = {};
        for (const provider of providers) {
          const existing = rows.find((r) => r.provider === provider.id);
          initial[provider.id] = {};
          for (const field of provider.fields) {
            const val = existing?.config[field.key];
            initial[provider.id][field.key] =
              typeof val === "string" && !val.startsWith("••••") ? val : "";
          }
        }
        setForms(initial);
      })
      .catch(() => setIntegrations([]));
  }, []);

  useEffect(load, [load]);

  function maskedValue(providerId: string, fieldKey: string): string | null {
    const existing = integrations?.find((r) => r.provider === providerId);
    const val = existing?.config[fieldKey];
    return typeof val === "string" && val.startsWith("••••") ? val : null;
  }

  async function saveProvider(providerId: string) {
    setSaving(providerId);
    try {
      const config = forms[providerId] ?? {};
      const payload: Record<string, string> = {};
      for (const [key, value] of Object.entries(config)) {
        if (value.trim()) payload[key] = value.trim();
      }
      await api("/api/integrations", {
        method: "PUT",
        json: { provider: providerId, config: payload },
      });
      toast("success", "Integration saved");
      load();
    } catch (error) {
      toast("error", "Couldn't save integration", (error as Error).message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Integrations"
        subtitle="Connect OpenAI, Twilio, and Samsara to power AI and messaging."
      />

      {integrations === null ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Key size={16} className="text-accent" />
                <h3 className="font-semibold">{provider.label}</h3>
              </div>
              <div className="space-y-4">
                {provider.fields.map((field) => {
                  const masked = maskedValue(provider.id, field.key);
                  return (
                    <Field
                      key={field.key}
                      label={field.label}
                      hint={
                        masked
                          ? `Current: ${masked} — leave blank to keep existing`
                          : undefined
                      }
                    >
                      <Input
                        type={field.secret ? "password" : "text"}
                        placeholder={masked ?? `Enter ${field.label.toLowerCase()}`}
                        value={forms[provider.id]?.[field.key] ?? ""}
                        onChange={(e) =>
                          setForms((prev) => ({
                            ...prev,
                            [provider.id]: {
                              ...(prev[provider.id] ?? {}),
                              [field.key]: e.target.value,
                            },
                          }))
                        }
                      />
                    </Field>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  icon={<Save size={15} />}
                  loading={saving === provider.id}
                  onClick={() => saveProvider(provider.id)}
                >
                  Save {provider.label}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
