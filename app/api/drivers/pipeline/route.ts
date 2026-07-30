import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule, requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  VALID_STAGE_IDS,
  statusForStage,
  logDriverActivity,
  type PipelineStageId,
} from "@/src/lib/recruiting";

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const { companyId } = await requireModule("recruiting");
    const body = await request.json().catch(() => ({}));

    const updates: {
      id: string;
      pipelineStage?: string;
      followUpAt?: string | null;
      terminalReason?: string;
      terminalKind?: string;
    }[] = Array.isArray(body.updates) ? body.updates : body.id
      ? [body]
      : [];

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    const ids = updates.map((u) => u.id).filter(Boolean);
    const drivers = await prisma.driver.findMany({
      where: { companyId, id: { in: ids } },
      select: { id: true, pipelineStage: true, firstName: true, lastName: true },
    });
    const byId = new Map(drivers.map((d) => [d.id, d]));

    let updated = 0;
    for (const item of updates) {
      const existing = byId.get(item.id);
      if (!existing) continue;

      const stage = item.pipelineStage;
      if (stage && !VALID_STAGE_IDS.has(stage as PipelineStageId)) continue;

      const data: Record<string, unknown> = {};

      if (stage) {
        data.pipelineStage = stage;
        data.status = statusForStage(stage as PipelineStageId);
        if (stage === "denied" || stage === "archived") {
          if (!item.terminalReason?.trim() && !body.terminalReason?.trim()) {
            return NextResponse.json(
              { error: "A reason is required when denying or archiving." },
              { status: 400 }
            );
          }
          data.terminalReason = (item.terminalReason ?? body.terminalReason ?? "").trim();
          data.terminalKind = stage === "denied" ? "denied" : "archived";
          data.archivedAt = new Date();
        } else {
          data.terminalReason = "";
          data.terminalKind = "";
          data.archivedAt = null;
        }
      }

      if ("followUpAt" in item) {
        data.followUpAt =
          item.followUpAt === null || item.followUpAt === ""
            ? null
            : new Date(item.followUpAt as string);
      } else if (body.followUpAt !== undefined) {
        data.followUpAt =
          body.followUpAt === null || body.followUpAt === ""
            ? null
            : new Date(body.followUpAt);
      }

      await prisma.driver.update({ where: { id: item.id }, data });

      if (stage && stage !== existing.pipelineStage) {
        await logDriverActivity(prisma, {
          driverId: item.id,
          body: `Moved to ${stage}${data.terminalReason ? `: ${data.terminalReason}` : ""}`,
          kind: "stage_change",
          userId: session.userId,
          userName: session.name,
        });
      }

      updated++;
    }

    return NextResponse.json({ updated });
  } catch (error) {
    return handleApiError(error);
  }
}
