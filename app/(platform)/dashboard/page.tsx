"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Megaphone,
  RefreshCw,
  Search,
  Shield,
  Target,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { IntelligenceSearchModal } from "@/src/components/recruiting/IntelligenceSearchModal";
import { PipelineAnalyticsPanel } from "@/src/components/recruiting/PipelineAnalyticsPanel";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";

interface OverviewData {
  kpis: {
    active: number;
    review: number;
    onboarding: number;
    hired: number;
    hold: number;
  };
  funnel: {
    stage: string;
    label: string;
    shortLabel: string;
    count: number;
    tone: string;
  }[];
  funnelMax: number;
  topSources: {
    source: string;
    count: number;
    drivers: { id: string; name: string; phone: string }[];
  }[];
  newLeads: number;
}

const toneRail: Record<string, string> = {
  accent: "stage-rail-accent",
  warning: "stage-rail-warning",
  violet: "stage-rail-violet",
  success: "stage-rail-success",
};

const KPI_META = [
  { key: "active", label: "Active leads", icon: Users, tone: "text-accent" },
  { key: "review", label: "In review", icon: Shield, tone: "text-violet" },
  { key: "onboarding", label: "Onboarding", icon: UserCheck, tone: "text-warning" },
  { key: "hired", label: "Hired", icon: UserPlus, tone: "text-success" },
  { key: "hold", label: "On hold", icon: ClipboardList, tone: "text-ink-secondary" },
] as const;

const QUICK_LINKS = [
  { href: "/drivers/pipeline", label: "Pipeline", icon: ClipboardList },
  { href: "/recruiting/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/recruiting/performance", label: "Performance", icon: Target },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/job-ads", label: "Job Ads", icon: Megaphone },
];

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api<OverviewData>("/api/recruiting/overview")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Overview"
        subtitle="Pipeline health, velocity, and hire-source performance at a glance."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={load}>
              Refresh
            </Button>
            <Button variant="secondary" size="sm" icon={<Search size={14} />} onClick={() => setSearchOpen(true)}>
              Search
            </Button>
            <Link href="/drivers/pipeline">
              <Button variant="secondary" size="sm" icon={<ClipboardList size={14} />}>
                Pipeline
              </Button>
            </Link>
            <Link href="/drivers?new=1">
              <Button size="sm" icon={<UserPlus size={14} />}>
                New driver
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loading || !data ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-2xl" />)
        ) : (
          KPI_META.map((card, i) => {
            const Icon = card.icon;
            const value = data.kpis[card.key as keyof typeof data.kpis];
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href="/drivers/pipeline">
                  <Card className="glass-raised p-4 transition-all hover:-translate-y-0.5 hover:shadow-raised">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-secondary">{card.label}</span>
                      <Icon size={15} className={card.tone} />
                    </div>
                    <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
                  </Card>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>

      {!loading && data && (
        <Card className="mb-5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Pipeline funnel</h2>
              <p className="text-xs text-ink-tertiary">Drivers by stage · open kanban to manage</p>
            </div>
            <Link href="/drivers/pipeline" className="text-xs font-semibold text-accent hover:underline">
              Open kanban <ArrowRight size={12} className="inline" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {data.funnel.map((stage, index) => {
              const pct = data.funnelMax > 0 ? (stage.count / data.funnelMax) * 100 : 0;
              return (
                <div key={stage.stage} className="relative min-w-0">
                  {index > 0 && (
                    <ChevronRight className="absolute -left-2 top-1/2 hidden -translate-y-1/2 text-ink-tertiary lg:block" size={14} />
                  )}
                  <div className={`rounded-xl border border-border/80 px-3 py-2.5 ${toneRail[stage.tone] ?? ""}`}>
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">
                      {stage.shortLabel}
                    </p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums">{stage.count}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/50">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${Math.max(pct, stage.count > 0 ? 12 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-ink-tertiary">Jump to</span>
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-solid px-3.5 py-1.5 text-xs font-semibold text-ink-secondary transition hover:border-accent hover:text-accent"
            >
              <Icon size={13} />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Top hire sources</h3>
              <p className="text-xs text-ink-tertiary">Attributed hires · expand to see drivers</p>
            </div>
            <Link href="/recruiting/hire-sources" className="text-xs font-semibold text-accent hover:underline">
              Manage
            </Link>
          </div>
          {!data || data.topSources.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-tertiary">No hires with sources yet.</p>
          ) : (
            <ul className="space-y-1">
              {data.topSources.map((source) => {
                const open = expandedSource === source.source;
                return (
                  <li key={source.source} className="rounded-xl border border-border/70">
                    <button
                      type="button"
                      onClick={() => setExpandedSource(open ? null : source.source)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold">{source.source}</p>
                        <p className="text-xs text-ink-tertiary">{source.count} hired</p>
                      </div>
                      <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <ul className="border-t border-border/60 px-3 py-2">
                        {source.drivers.map((d) => (
                          <li key={d.id}>
                            <Link href={`/drivers/${d.id}`} className="block py-1.5 text-sm hover:text-accent">
                              {d.name}
                              {d.phone ? <span className="text-ink-tertiary"> · {d.phone}</span> : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col justify-center p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">New leads waiting</h3>
              <p className="mt-1 text-3xl font-bold tabular-nums">{data?.newLeads ?? "—"}</p>
              <Link href="/leads" className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline">
                Work leads <ArrowRight size={12} className="inline" />
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <BarChart3 size={16} />
        <h2 className="text-base font-semibold">Pipeline analytics</h2>
      </div>
      <PipelineAnalyticsPanel embedded />

      <IntelligenceSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
