"use client";

import { useEffect, useState } from "react";
import { CreditCard, Sparkles } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { MODULES, type ModuleId } from "@/src/lib/modules";

interface ModulesResponse {
  enabledModules: ModuleId[];
  availableModules: ModuleId[];
}

export default function BillingSettingsPage() {
  const toast = useToast();
  const [modules, setModules] = useState<ModulesResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const plan = "trial";

  useEffect(() => {
    api<ModulesResponse>("/api/company/modules")
      .then(setModules)
      .catch(() => setModules(null));
  }, []);

  async function startCheckout() {
    setCheckoutLoading(true);
    try {
      const result = await api<{
        configured: boolean;
        checkoutUrl: string | null;
        message?: string;
      }>("/api/billing/checkout", { method: "POST", json: { plan: "pro" } });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.message) {
        toast("info", "Checkout", result.message);
      } else {
        toast("info", "Stripe not configured", "Billing checkout will be available soon.");
      }
    } catch (error) {
      toast("error", "Checkout failed", (error as Error).message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Billing"
        subtitle="Your plan, enabled modules, and subscription."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">
                Current plan
              </p>
              <h3 className="mt-1 text-2xl font-semibold capitalize">{plan}</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Upgrade to unlock all modules and higher limits.
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Sparkles size={22} />
            </div>
          </div>
          <Button
            className="mt-5 w-full sm:w-auto"
            icon={<CreditCard size={15} />}
            loading={checkoutLoading}
            onClick={startCheckout}
          >
            Upgrade with Stripe
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold">Enabled modules</h3>
          <p className="mt-1 text-sm text-ink-secondary">
            Modules included in your subscription.
          </p>
          {modules === null ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {modules.enabledModules.map((id) => (
                <Badge key={id} tone="success">
                  {MODULES[id].label}
                </Badge>
              ))}
              {modules.availableModules
                .filter((id) => !modules.enabledModules.includes(id))
                .map((id) => (
                  <Badge key={id} tone="neutral">
                    {MODULES[id].label}
                  </Badge>
                ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
