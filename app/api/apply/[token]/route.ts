import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  extractDriverDocument,
  isAiConfigured,
  isExtractableMimeType,
} from "@/src/lib/openai";
import { logDriverActivity } from "@/src/lib/recruiting";

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
      pipelineStage: true,
      applyToken: true,
      company: { select: { name: true } },
    },
  });

  if (!driver) {
    return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  }

  return NextResponse.json({
    firstName: driver.firstName,
    companyName: driver.company.name,
    completed: driver.onboardingStep >= 4,
    trackToken: driver.applyToken,
  });
}

/** Public: driver submits application details and documents. */
export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  const driver = await prisma.driver.findUnique({
    where: { applyToken: token },
    select: {
      id: true,
      companyId: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      city: true,
      state: true,
      experienceYears: true,
      endorsements: true,
      preferredRoute: true,
      cdlNumber: true,
      cdlState: true,
      cdlExpiry: true,
      employersJson: true,
      onboardingStep: true,
      pipelineStage: true,
    },
  });
  if (!driver) {
    return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.step === "about") {
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        phone: String(body.phone ?? driver.phone).trim(),
        email: String(body.email ?? driver.email).trim(),
        city: String(body.city ?? driver.city).trim(),
        state: String(body.state ?? driver.state).trim(),
        experienceYears:
          body.experienceYears != null && body.experienceYears !== ""
            ? Number(body.experienceYears) || null
            : driver.experienceYears,
        preferredRoute: String(body.preferredRoute ?? driver.preferredRoute).trim(),
        driverType: String(body.driverType ?? "").trim(),
        onboardingStep: Math.max(driver.onboardingStep, 1),
        pipelineStage: driver.pipelineStage === "lead" ? "application" : driver.pipelineStage,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.step === "license") {
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        cdlNumber: String(body.cdlNumber ?? driver.cdlNumber).trim(),
        cdlState: String(body.cdlState ?? driver.cdlState).trim(),
        endorsements: String(body.endorsements ?? driver.endorsements).trim(),
        cdlExpiry: body.cdlExpiry ? new Date(body.cdlExpiry) : driver.cdlExpiry,
        onboardingStep: Math.max(driver.onboardingStep, 2),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.step === "employment") {
    const employers = Array.isArray(body.employers) ? body.employers : [];
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        employersJson: JSON.stringify(employers),
        onboardingStep: Math.max(driver.onboardingStep, 3),
      },
    });
    return NextResponse.json({ ok: true });
  }

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
        reviewStatus: extracted ? "reviewed" : "pending",
      },
    });

    const updates: Record<string, unknown> = {};
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
    if (Object.keys(updates).length > 0) {
      await prisma.driver.update({ where: { id: driver.id }, data: updates });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.step === "finish") {
    const hasDocs = await prisma.document.count({ where: { driverId: driver.id } });
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        onboardingStep: 4,
        pipelineStage: hasDocs > 0 ? "documents" : "application",
      },
    });
    await logDriverActivity(prisma, {
      driverId: driver.id,
      body: `${driver.firstName} ${driver.lastName} submitted their application.`,
      kind: "system",
    });
    await prisma.message.create({
      data: {
        companyId: driver.companyId,
        driverId: driver.id,
        direction: "inbound",
        channel: "system",
        contactName: `${driver.firstName} ${driver.lastName}`,
        body: `${driver.firstName} ${driver.lastName} completed their application.`,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown step." }, { status: 400 });
}
