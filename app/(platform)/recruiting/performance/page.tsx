"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/src/components/PageHeader";
import {
  RecruitingPerformancePanel,
  type PerformanceData,
} from "@/src/components/recruiting/RecruitingPerformancePanel";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";

export default function RecruitingPerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    api<PerformanceData>("/api/analytics/recruiting-performance")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Performance"
        subtitle="Hiring outcomes, weekly trends, retention by source, and exportable driver detail."
      />

      {!data ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <RecruitingPerformancePanel data={data} />
      )}
    </div>
  );
}
