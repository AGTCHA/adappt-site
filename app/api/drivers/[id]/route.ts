import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule, requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { logDriverActivity, statusForStage, VALID_STAGE_IDS, type PipelineStageId } from "@/src/lib/recruiting";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { id } = await params;

    const driver = await prisma.driver.findFirst({
      where: { id, companyId },
      include: {
        truck: { select: { id: true, unitNumber: true, year: true, make: true, model: true } },
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            mimeType: true,
            extracted: true,
            reviewStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }
    return NextResponse.json({ driver });
  } catch (error) {
    return handleApiError(error);
  }
}

const editableStringFields = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "status",
  "endorsements",
  "preferredRoute",
  "notes",
  "cdlNumber",
  "cdlState",
  "pipelineStage",
  "hireSource",
  "hireSourceOther",
  "driverType",
  "city",
  "state",
  "emergencyContact",
  "employersJson",
  "terminalReason",
] as const;

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { companyId } = await requireModule("recruiting");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.driver.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    for (const field of editableStringFields) {
      if (typeof body[field] === "string") data[field] = body[field].trim();
    }
    if ("experienceYears" in body) {
      data.experienceYears =
        body.experienceYears === null || body.experienceYears === ""
          ? null
          : Number(body.experienceYears);
    }
    for (const dateField of ["cdlExpiry", "medCardExpiry", "dateOfBirth", "followUpAt"] as const) {
      if (dateField in body) {
        data[dateField] = body[dateField] ? new Date(body[dateField]) : null;
      }
    }
    if (typeof body.onboardingStep === "number") {
      data.onboardingStep = body.onboardingStep;
    }

    if (typeof body.pipelineStage === "string" && VALID_STAGE_IDS.has(body.pipelineStage as PipelineStageId)) {
      data.status = statusForStage(body.pipelineStage as PipelineStageId);
      if (body.pipelineStage === "denied" || body.pipelineStage === "archived") {
        data.terminalKind = body.pipelineStage;
        data.archivedAt = new Date();
      }
    }

    const driver = await prisma.driver.update({ where: { id }, data });

    if (
      typeof body.pipelineStage === "string" &&
      body.pipelineStage !== existing.pipelineStage
    ) {
      await logDriverActivity(prisma, {
        driverId: id,
        body: `Stage changed to ${body.pipelineStage}`,
        kind: "stage_change",
        userId: session.userId,
        userName: session.name,
      });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { id } = await params;

    const existing = await prisma.driver.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    await prisma.driver.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
