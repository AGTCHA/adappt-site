import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const userId = await requireUserId();
    const drivers = await prisma.driver.findMany({
      where: { userId },
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
    const userId = await requireUserId();
    const body = await request.json().catch(() => ({}));

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First and last name are required." },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.create({
      data: {
        userId,
        firstName,
        lastName,
        phone: String(body.phone ?? "").trim(),
        email: String(body.email ?? "").trim(),
        status: body.status === "active" ? "active" : "onboarding",
        experienceYears:
          body.experienceYears != null && body.experienceYears !== ""
            ? Number(body.experienceYears)
            : null,
        endorsements: String(body.endorsements ?? "").trim(),
        preferredRoute: String(body.preferredRoute ?? "").trim(),
        source: String(body.source ?? "manual"),
        notes: String(body.notes ?? "").trim(),
        onboardingStep: 1,
        applyToken: randomBytes(16).toString("hex"),
      },
    });

    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
