import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  dashboardKpis,
  fetchDriverAnalyticsRows,
  funnelFromCounts,
  stageCounts,
  topHireSources,
  hireSourceStats,
} from "@/src/lib/recruiting-analytics";

export async function GET() {
  try {
    const { companyId } = await requireModule("recruiting");
    const drivers = await fetchDriverAnalyticsRows(prisma, companyId);
    const counts = stageCounts(drivers);
    const kpis = dashboardKpis(counts);
    const funnel = funnelFromCounts(counts);
    const topSources = topHireSources(drivers);
    const hireSources = hireSourceStats(drivers);

    const newLeads = await prisma.lead.count({
      where: { companyId, disposition: "new" },
    });

    return NextResponse.json({
      kpis,
      funnel,
      funnelMax: Math.max(...funnel.map((f) => f.count), 1),
      topSources,
      hireSourceStats: hireSources,
      newLeads,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
