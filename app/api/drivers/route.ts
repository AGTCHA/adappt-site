import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const { companyId } = await requireModule("recruiting");
    const drivers = await prisma.driver.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        truck: { select: { id: true, unitNumber: true } },
        documents: { select: { id: true, type: true } },
      },
    });
    return NextResponse.json({ drivers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("recruiting");
    const body = await request.json().catch(() => ({}));

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First and last name are required." },
        { status: 400 }
      );
    }

    const parseDate = (value: unknown) => {
      if (typeof value !== "string" || !value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const driver = await prisma.driver.create({
      data: {
        companyId,
        firstName,
        lastName,
        phone: String(body.phone ?? "").trim(),
        email: String(body.email ?? "").trim(),
        pipelineStage:
          body.status === "active"
            ? "hired"
            : body.status === "onboarding"
              ? "documents"
              : "lead",
        status:
          body.status === "active"
            ? "active"
            : body.status === "applicant"
              ? "applicant"
              : "onboarding",
        experienceYears:
          body.experienceYears != null && body.experienceYears !== ""
            ? Number(body.experienceYears)
            : null,
        endorsements: String(body.endorsements ?? "").trim(),
        preferredRoute: String(body.preferredRoute ?? "").trim(),
        source: String(body.source ?? "manual"),
        notes: String(body.notes ?? "").trim(),
        cdlNumber: String(body.cdlNumber ?? "").trim(),
        cdlState: String(body.cdlState ?? "").trim(),
        cdlExpiry: parseDate(body.cdlExpiry),
        medCardExpiry: parseDate(body.medCardExpiry),
        onboardingStep: 1,
        applyToken: randomBytes(16).toString("hex"),
      },
    });

    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
