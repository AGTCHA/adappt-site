import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { ACTIVE_PIPELINE_STAGES, STAGE_LABELS } from "@/src/lib/recruiting";

export async function GET() {
  try {
    const { companyId } = await requireModule("recruiting");

    const drivers = await prisma.driver.findMany({
      where: { companyId },
      select: {
        pipelineStage: true,
        hireSource: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const byStage: Record<string, number> = {};
    for (const stage of ACTIVE_PIPELINE_STAGES) byStage[stage.id] = 0;
    byStage.hold = 0;
    byStage.denied = 0;
    byStage.archived = 0;

    const byHireSource: Record<string, number> = {};
    for (const d of drivers) {
      byStage[d.pipelineStage] = (byStage[d.pipelineStage] ?? 0) + 1;
      const src = d.hireSource?.trim() || "Unknown";
      byHireSource[src] = (byHireSource[src] ?? 0) + 1;
    }

    const funnel = Object.entries(byStage)
      .filter(([id]) => STAGE_LABELS[id])
      .map(([id, count]) => ({ stage: id, label: STAGE_LABELS[id] ?? id, count }));

    const hireSources = Object.entries(byHireSource)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const leads = await prisma.lead.groupBy({
      by: ["disposition"],
      where: { companyId },
      _count: true,
    });

    return NextResponse.json({
      totalDrivers: drivers.length,
      funnel,
      hireSources,
      leadDispositions: leads.map((l) => ({
        disposition: l.disposition,
        count: l._count,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
