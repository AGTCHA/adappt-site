import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  buildPerformanceSummary,
  fetchDriverAnalyticsRows,
  retentionAnalysis,
} from "@/src/lib/recruiting-analytics";

export async function GET() {
  try {
    const { companyId } = await requireModule("recruiting");
    const drivers = await fetchDriverAnalyticsRows(prisma, companyId);
    const performance = buildPerformanceSummary(drivers);
    const retention = retentionAnalysis(drivers);

    return NextResponse.json({
      ...performance,
      retentionAnalysis: retention,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
