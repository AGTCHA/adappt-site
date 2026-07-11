import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const driver = await prisma.driver.findFirst({
      where: { id, userId },
      include: {
        truck: { select: { id: true, unitNumber: true, year: true, make: true, model: true } },
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            mimeType: true,
            extracted: true,
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
] as const;

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.driver.findFirst({ where: { id, userId } });
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
    for (const dateField of ["cdlExpiry", "medCardExpiry"] as const) {
      if (dateField in body) {
        data[dateField] = body[dateField] ? new Date(body[dateField]) : null;
      }
    }
    if (typeof body.onboardingStep === "number") {
      data.onboardingStep = body.onboardingStep;
    }

    const driver = await prisma.driver.update({ where: { id }, data });
    return NextResponse.json({ driver });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await prisma.driver.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    await prisma.driver.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
