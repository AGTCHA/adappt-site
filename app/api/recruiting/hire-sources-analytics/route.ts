import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  divisionTrends,
  driverTypeTrends,
  fetchDriverAnalyticsRows,
  hireSourceInsights,
  hireSourceStats,
  monthlyHiresBySource,
} from "@/src/lib/recruiting-analytics";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const period = searchParams.get("period") === "month" ? "month" : "week";
    const rangeParam = searchParams.get("range");
    const range =
      rangeParam === "3months" || rangeParam === "6months" || rangeParam === "12months"
        ? rangeParam
        : "all";

    const drivers = await fetchDriverAnalyticsRows(prisma, companyId);
    const stats = hireSourceStats(drivers);
    const totalHired = drivers.filter((d) => d.pipelineStage === "hired").length;

    let driverSearch: {
      id: string;
      name: string;
      phone: string;
      email: string;
      hireSource: string;
      pipelineStage: string;
    }[] = [];

    if (q.length >= 2) {
      driverSearch = drivers
        .filter((d) => {
          const hay = `${d.firstName} ${d.lastName} ${d.phone} ${d.email} ${d.hireSource}`.toLowerCase();
          return hay.includes(q);
        })
        .slice(0, 20)
        .map((d) => ({
          id: d.id,
          name: `${d.firstName} ${d.lastName}`.trim(),
          phone: d.phone,
          email: d.email,
          hireSource: d.hireSource || "Not specified",
          pipelineStage: d.pipelineStage,
        }));
    }

    return NextResponse.json({
      stats,
      monthly: monthlyHiresBySource(drivers),
      insights: hireSourceInsights(stats, totalHired),
      driverTypeTrends: driverTypeTrends(drivers, period, range),
      divisionTrends: divisionTrends(drivers, period, range),
      driverSearch,
      totalHired,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
