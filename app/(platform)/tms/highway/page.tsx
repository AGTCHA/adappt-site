"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Input } from "@/src/components/ui/Field";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatDate } from "@/src/lib/format";

interface CarrierResult {
  dot: string;
  name: string;
  mc: string | null;
  address: string | null;
  phone: string | null;
  safetyRating: string | null;
  insuranceOnFile: boolean;
  authority: string | null;
  alerts: number;
}

interface Alert {
  id: string;
  carrierId: string;
  carrierName: string;
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  acknowledged: boolean;
  createdAt: string;
}

const severityTone: Record<string, "neutral" | "warning" | "danger" | "accent"> = {
  low: "neutral",
  medium: "accent",
  high: "warning",
  critical: "danger",
};

const demoResults: CarrierResult[] = [
  {
    dot: "1234567",
    name: "Demo Freight LLC",
    mc: "MC-987654",
    address: "123 Main St, Dallas, TX 75201",
    phone: "(214) 555-0100",
    safetyRating: "Satisfactory",
    insuranceOnFile: true,
    authority: "Active",
    alerts: 0,
  },
  {
    dot: "2345678",
    name: "Express Haul Inc",
    mc: "MC-876543",
    address: "456 Elm Ave, Chicago, IL 60601",
    phone: "(312) 555-0200",
    safetyRating: "Conditional",
    insuranceOnFile: true,
    authority: "Active",
    alerts: 2,
  },
  {
    dot: "3456789",
    name: "Midwest Transport Co",
    mc: null,
    address: "789 Oak Blvd, Memphis, TN 38103",
    phone: "(901) 555-0300",
    safetyRating: "Not Rated",
    insuranceOnFile: false,
    authority: "Inactive",
    alerts: 1,
  },
];

export default function HighwayPage() {
  const toast = useToast();
  const [dot, setDot] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CarrierResult[] | null>(null);
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  const fetchAlerts = useCallback(() => {
    api<{ alerts: Alert[] }>("/api/tms/highway/alerts")
      .then(({ alerts: rows }) => setAlerts(rows))
      .catch(() => setAlerts([]));
  }, []);

  useEffect(() => {
    api<{ configured: boolean }>("/api/tms/highway/status")
      .then(({ configured }) => setHasApiKey(configured))
      .catch(() => setHasApiKey(false));
    fetchAlerts();
  }, [fetchAlerts]);

  async function lookupCarrier(e: React.FormEvent) {
    e.preventDefault();
    if (!dot.trim()) return;
    setSearching(true);
    setResults(null);
    try {
      const data = await api<{ carriers: CarrierResult[] }>(
        `/api/tms/highway/lookup?dot=${encodeURIComponent(dot.trim())}`
      );
      setResults(data.carriers);
    } catch {
      if (hasApiKey === false) {
        setResults(demoResults.filter((d) => d.dot.includes(dot.trim()) || d.name.toLowerCase().includes(dot.toLowerCase())));
        toast("warning", "Demo mode", "No Highway API key configured — showing sample data.");
      } else {
        setResults([]);
        toast("error", "Lookup failed", "Could not find carrier with that DOT number.");
      }
    } finally {
      setSearching(false);
    }
  }

  async function syncAll() {
    setSyncing(true);
    try {
      await api("/api/tms/highway/sync", { method: "POST" });
      toast("success", "Sync started", "Carrier data sync initiated.");
      fetchAlerts();
    } catch (err) {
      toast("error", "Sync failed", (err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  async function acknowledgeAlert(id: string) {
    try {
      await api(`/api/tms/highway/alerts/${id}/acknowledge`, { method: "POST" });
      toast("success", "Alert acknowledged");
      fetchAlerts();
    } catch (err) {
      toast("error", "Failed", (err as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Highway"
        subtitle="Carrier monitoring, DOT lookup, and compliance alerts via Highway."
        actions={
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} />}
            onClick={syncAll}
            loading={syncing}
          >
            Sync carriers
          </Button>
        }
      />

      {hasApiKey === false && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass rounded-2xl border border-warning/30 p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-warning" />
            <div>
              <p className="text-sm font-semibold">No Highway API key</p>
              <p className="text-xs text-ink-secondary">
                Configure your Highway API key in{" "}
                <a href="/tms/settings" className="text-accent hover:underline">
                  TMS Settings
                </a>{" "}
                to enable live carrier monitoring. Demo data shown below.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* DOT Lookup */}
      <div className="mb-8">
        <h2 className="mb-3 text-base font-semibold">Carrier lookup</h2>
        <form onSubmit={lookupCarrier} className="flex gap-3">
          <div className="relative max-w-sm flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <Input
              placeholder="Enter DOT number or carrier name…"
              value={dot}
              onChange={(e) => setDot(e.target.value)}
              className="!pl-8"
            />
          </div>
          <Button type="submit" loading={searching}>
            Lookup
          </Button>
        </form>

        {results !== null && (
          <div className="mt-4">
            {results.length === 0 ? (
              <p className="text-sm text-ink-tertiary">No carriers found.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((carrier) => (
                  <motion.div
                    key={carrier.dot}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{carrier.name}</p>
                        <p className="text-xs text-ink-tertiary">DOT {carrier.dot}</p>
                      </div>
                      <Badge
                        tone={
                          carrier.authority === "Active" ? "success" : "danger"
                        }
                      >
                        {carrier.authority ?? "Unknown"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-ink-secondary">
                      {carrier.mc && <p>MC: {carrier.mc}</p>}
                      {carrier.address && <p>{carrier.address}</p>}
                      {carrier.phone && <p>{carrier.phone}</p>}
                      <div className="flex items-center gap-2 pt-1">
                        <Badge
                          tone={
                            carrier.safetyRating === "Satisfactory"
                              ? "success"
                              : carrier.safetyRating === "Conditional"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          <Shield size={10} /> {carrier.safetyRating ?? "Unrated"}
                        </Badge>
                        <Badge tone={carrier.insuranceOnFile ? "success" : "danger"}>
                          {carrier.insuranceOnFile ? "Insured" : "No insurance"}
                        </Badge>
                      </div>
                      {carrier.alerts > 0 && (
                        <p className="flex items-center gap-1 pt-1 text-xs text-warning">
                          <AlertTriangle size={11} /> {carrier.alerts} alert
                          {carrier.alerts > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div>
        <h2 className="mb-3 text-base font-semibold">Monitoring alerts</h2>
        {alerts === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={24} />}
            title="No alerts"
            description="All monitored carriers are in good standing. Alerts will appear here when compliance issues arise."
          />
        ) : (
          <div className="glass overflow-hidden rounded-2xl">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.15) }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0"
              >
                <Badge tone={severityTone[alert.severity] ?? "neutral"}>
                  {alert.severity}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-ink-tertiary">
                    {alert.carrierName} · {formatDate(alert.createdAt)}
                  </p>
                </div>
                {!alert.acknowledged && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
                {alert.acknowledged && (
                  <Badge tone="success">Acknowledged</Badge>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
