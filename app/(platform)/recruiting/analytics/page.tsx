"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/src/components/PageHeader";
import { HireSourceAnalyticsPanel } from "@/src/components/recruiting/HireSourceAnalyticsPanel";
import { PipelineAnalyticsPanel } from "@/src/components/recruiting/PipelineAnalyticsPanel";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";

type Tab = "sources" | "pipeline";

interface HireAnalyticsData {
  stats: { source: string; count: number }[];
  monthly: { month: string; sources: Record<string, number>; total: number }[];
  insights: { type: "success" | "warning" | "info"; text: string }[];
  driverTypeTrends: Record<string, number | string>[];
  divisionTrends: Record<string, number | string>[];
  driverSearch: {
    id: string;
    name: string;
    phone: string;
    email: string;
    hireSource: string;
    pipelineStage: string;
  }[];
  totalHired: number;
}

export default function RecruitingAnalyticsPage() {
  const [tab, setTab] = useState<Tab>("sources");
  const [data, setData] = useState<HireAnalyticsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [period] = useState("week");
  const [range] = useState("6months");

  useEffect(() => {
    const q = searchQuery.length >= 2 ? `&q=${encodeURIComponent(searchQuery)}` : "";
    api<HireAnalyticsData>(
      `/api/recruiting/hire-sources-analytics?period=${period}&range=${range}${q}`
    )
      .then(setData)
      .catch(() => setData(null));
  }, [searchQuery, period, range]);

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Analytics"
        subtitle="Hire-source attribution, pipeline velocity, onboarding trends, and retention."
        actions={
          <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
            {(
              [
                { id: "sources" as Tab, label: "Hire sources" },
                { id: "pipeline" as Tab, label: "Pipeline" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  tab === t.id ? "bg-accent text-accent-text" : "text-ink-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {tab === "pipeline" ? (
        <PipelineAnalyticsPanel />
      ) : !data ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <HireSourceAnalyticsPanel
          {...data}
          searchQuery={searchQuery}
          onSearchQuery={setSearchQuery}
        />
      )}
    </div>
  );
}
