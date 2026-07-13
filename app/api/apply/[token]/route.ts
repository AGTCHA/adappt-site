import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  extractDriverDocument,
  isAiConfigured,
  isExtractableMimeType,
} from "@/src/lib/openai";

export const maxDuration = 120;

type Params = { params: Promise<{ token: string }> };

/** Public: fetch minimal info for the driver application page. */
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;

  const driver = await prisma.driver.findUnique({
    where: { applyToken: token },
    select: {
      firstName: true,
      lastName: true,
      onboardingStep: true,
      user: { select: { companyName: true } },
    },
  });

  if (!driver) {
    return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  }

  return NextResponse.json({
    firstName: driver.firstName,
    companyName: driver.user.companyName,
    completed: driver.onboardingStep >= 3,
  });
}

/** Public: driver submits application details and documents. */
export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  const driver = await prisma.driver.findUnique({
    where: { applyToken: token },
    include: { user: { select: { id: true } } },
  });
  if (!driver) {
    return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  // Step: application fields
  if (body.step === "application") {
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        phone: String(body.phone ?? driver.phone).trim(),
        email: String(body.email ?? driver.email).trim(),
        experienceYears:
          body.experienceYears != null && body.experienceYears !== ""
            ? Number(body.experienceYears) || null
            : driver.experienceYears,
        endorsements: String(body.endorsements ?? driver.endorsements).trim(),
        preferredRoute: String(body.preferredRoute ?? driver.preferredRoute).trim(),
        onboardingStep: Math.max(driver.onboardingStep, 1),
      },
    });
    return NextResponse.json({ ok: true });
  }

  // Step: document upload
  if (body.step === "document") {
    const type = ["cdl", "medcard"].includes(body.type) ? body.type : "other";
    const dataUrl = String(body.dataUrl ?? "");
    const mimeType = String(body.mimeType ?? "application/octet-stream");

    if (!dataUrl.startsWith("data:") || dataUrl.length > 12_000_000) {
      return NextResponse.json({ error: "Invalid or oversized file." }, { status: 400 });
    }

    let extracted: Record<string, unknown> | null = null;
    if (isAiConfigured() && isExtractableMimeType(mimeType)) {
      extracted = await extractDriverDocument(
        { dataUrl, mimeType, fileName: String(body.fileName ?? "document") },
        type
      );
    }

    await prisma.document.create({
      data: {
        driverId: driver.id,
        type,
        fileName: String(body.fileName ?? "document"),
        mimeType,
        data: dataUrl,
        extracted: extracted ? JSON.stringify(extracted) : "",
      },
    });

    const updates: Record<string, unknown> = {
      onboardingStep: Math.max(driver.onboardingStep, 2),
    };
    if (extracted && type === "cdl") {
      if (typeof extracted.cdlNumber === "string" && !driver.cdlNumber) {
        updates.cdlNumber = extracted.cdlNumber;
      }
      if (typeof extracted.state === "string" && !driver.cdlState) {
        updates.cdlState = extracted.state;
      }
      if (typeof extracted.expirationDate === "string") {
        const date = new Date(extracted.expirationDate);
        if (!Number.isNaN(date.getTime())) updates.cdlExpiry = date;
      }
    }
    if (extracted && type === "medcard" && typeof extracted.expirationDate === "string") {
      const date = new Date(extracted.expirationDate);
      if (!Number.isNaN(date.getTime())) updates.medCardExpiry = date;
    }
    await prisma.driver.update({ where: { id: driver.id }, data: updates });

    return NextResponse.json({ ok: true });
  }

  // Step: finish
  if (body.step === "finish") {
    await prisma.driver.update({
      where: { id: driver.id },
      data: { onboardingStep: 3 },
    });
    await prisma.message.create({
      data: {
        userId: driver.user.id,
        driverId: driver.id,
        direction: "inbound",
        channel: "system",
        contactName: `${driver.firstName} ${driver.lastName}`,
        body: `${driver.firstName} ${driver.lastName} completed their onboarding application.`,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown step." }, { status: 400 });
}
