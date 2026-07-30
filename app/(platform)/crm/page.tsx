"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Target } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Card } from "@/src/components/ui/Card";
import { StatCard } from "@/src/components/ui/StatCard";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import { formatCurrency } from "@/src/lib/format";

interface DealRow {
  id: string;
  title: string;
  value: number | null;
  stage: string;
  customer: { id: string; name: string };
}

interface CustomerRow {
  id: string;
  name: string;
  stage: string;
}

const DEAL_STAGES = [
  { id: "prospect", label: "Prospect", rail: "stage-rail-accent" },
  { id: "qualified", label: "Qualified", rail: "stage-rail-violet" },
  { id: "proposal", label: "Proposal", rail: "stage-rail-warning" },
  { id: "negotiation", label: "Negotiation", rail: "stage-rail-accent" },
  { id: "won", label: "Won", rail: "stage-rail-success" },
  { id: "lost", label: "Lost", rail: "stage-rail-danger" },
] as const;

export default function CrmPipelinePage() {
  const [deals, setDeals] = useState<DealRow[] | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);

  useEffect(() => {
    api<{ deals: DealRow[] }>("/api/crm/deals")
      .then(({ deals: rows }) => setDeals(rows))
      .catch(() => setDeals([]));
    api<{ customers: CustomerRow[] }>("/api/crm/customers")
      .then(({ customers: rows }) => setCustomers(rows))
      .catch(() => setCustomers([]));
  }, []);

  const byStage = useMemo(() => {
    const map: Record<string, DealRow[]> = {};
    for (const stage of DEAL_STAGES) map[stage.id] = [];
    for (const deal of deals ?? []) {
      const key = map[deal.stage] ? deal.stage : "prospect";
      map[key].push(deal);
    }
    return map;
  }, [deals]);

  const pipelineValue = useMemo(
    () =>
      (deals ?? [])
        .filter((d) => !["won", "lost"].includes(d.stage))
        .reduce((sum, d) => sum + (d.value ?? 0), 0),
    [deals]
  );

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="CRM Pipeline"
        subtitle="Track deals from first contact to close."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {deals === null || customers === null ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Customers"
              value={customers.length}
              sub="in your CRM"
              icon={<Building2 size={17} />}
              tone="accent"
            />
            <StatCard
              label="Open deals"
              value={deals.filter((d) => !["won", "lost"].includes(d.stage)).length}
              sub={formatCurrency(pipelineValue) + " pipeline"}
              icon={<Target size={17} />}
              tone="warning"
              delay={0.05}
            />
            <StatCard
              label="Won"
              value={deals.filter((d) => d.stage === "won").length}
              sub="closed deals"
              icon={<Target size={17} />}
              tone="success"
              delay={0.1}
            />
          </>
        )}
      </div>

      <Card className="mb-6 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-secondary">Manage your customer accounts</p>
          <Link
            href="/crm/customers"
            className="focus-ring flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            Customers
            <ArrowRight size={14} />
          </Link>
        </div>
      </Card>

      {deals === null ? (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {DEAL_STAGES.map((stage, colIndex) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.05 }}
              className={`glass flex min-h-[320px] flex-col overflow-hidden rounded-2xl ${stage.rail}`}
            >
              <div className="px-3 py-3">
                <h3 className="text-xs font-semibold tracking-tight text-ink">{stage.label}</h3>
                <p className="mt-0.5 text-[11px] text-ink-secondary">
                  {byStage[stage.id]?.length ?? 0} deal
                  {(byStage[stage.id]?.length ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto border-t border-border/70 p-2">
                {(byStage[stage.id] ?? []).map((deal) => (
                  <div key={deal.id} className="glass-raised rounded-xl border border-border/70 p-3">
                    <p className="truncate text-sm font-semibold text-ink">{deal.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-secondary">
                      {deal.customer.name}
                    </p>
                    {deal.value != null && (
                      <p className="mt-1.5 text-xs font-semibold text-accent">
                        {formatCurrency(deal.value)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
