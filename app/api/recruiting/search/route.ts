import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { STAGE_LABELS } from "@/src/lib/recruiting";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json({ query: q, results: [] });
    }

    const pattern = q.toLowerCase();
    const [drivers, leads] = await Promise.all([
      prisma.driver.findMany({
        where: { companyId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          pipelineStage: true,
          hireSource: true,
        },
        take: 100,
      }),
      prisma.lead.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          disposition: true,
          jobAd: { select: { title: true } },
        },
        take: 100,
      }),
    ]);

    const driverResults = drivers
      .filter((d) => {
        const hay = `${d.firstName} ${d.lastName} ${d.phone} ${d.email} ${d.hireSource}`.toLowerCase();
        return hay.includes(pattern);
      })
      .slice(0, 8)
      .map((d) => ({
        kind: "driver" as const,
        id: d.id,
        title: `${d.firstName} ${d.lastName}`.trim(),
        subtitle: STAGE_LABELS[d.pipelineStage] ?? d.pipelineStage,
        phone: d.phone,
        href: `/drivers/${d.id}`,
      }));

    const leadResults = leads
      .filter((l) => {
        const hay = `${l.name} ${l.phone} ${l.email} ${l.jobAd.title}`.toLowerCase();
        return hay.includes(pattern);
      })
      .slice(0, 8)
      .map((l) => ({
        kind: "lead" as const,
        id: l.id,
        title: l.name || "Unknown lead",
        subtitle: `${l.disposition} · ${l.jobAd.title}`,
        phone: l.phone,
        href: `/leads`,
      }));

    return NextResponse.json({
      query: q,
      results: [...driverResults, ...leadResults].slice(0, 12),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
