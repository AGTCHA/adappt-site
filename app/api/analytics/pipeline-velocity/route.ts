import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  fetchDriverAnalyticsRows,
  pipelineVelocity,
  hireSourceStats,
} from "@/src/lib/recruiting-analytics";

export async function GET() {
  try {
    const { companyId } = await requireModule("recruiting");
    const drivers = await fetchDriverAnalyticsRows(prisma, companyId);
    const velocity = pipelineVelocity(drivers);
    const fastMovers = velocity.filter((d) => d.velocity === "fast");
    const slowMovers = velocity.filter((d) => d.velocity === "slow");
    const avgTimeToHire =
      fastMovers.length > 0
        ? fastMovers.reduce((s, d) => s + d.totalDays, 0) / fastMovers.length
        : 0;

    return NextResponse.json({
      activePipeline: velocity.length,
      avgTimeToHire: Math.round(avgTimeToHire * 10) / 10,
      fastMovers: fastMovers.length,
      needsAttention: slowMovers.length,
      velocity,
      hireSourceStats: hireSourceStats(drivers),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
