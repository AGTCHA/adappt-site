import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  extractDriverDocument,
  isAiConfigured,
  isExtractableMimeType,
} from "@/src/lib/openai";

export const maxDuration = 120;

type Params = { params: Promise<{ id: string }> };

const MAX_DATAURL_LENGTH = 20_000_000; // ~14MB file as base64

export async function POST(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const driver = await prisma.driver.findFirst({ where: { id, userId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const type = ["cdl", "medcard", "application", "other"].includes(body.type)
      ? body.type
      : "other";
    const fileName = String(body.fileName ?? "document");
    const mimeType = String(body.mimeType ?? "application/octet-stream");
    const dataUrl = String(body.dataUrl ?? "");

    if (!dataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Invalid file upload." }, { status: 400 });
    }
    if (dataUrl.length > MAX_DATAURL_LENGTH) {
      return NextResponse.json(
        { error: "File is too large. Please upload a file under 14MB." },
        { status: 400 }
      );
    }

    // AI extraction (applications are extracted client-side before upload)
    let extracted: Record<string, unknown> | null = null;
    if (
      isAiConfigured() &&
      isExtractableMimeType(mimeType) &&
      (type === "cdl" || type === "medcard")
    ) {
      extracted = await extractDriverDocument({ dataUrl, mimeType, fileName }, type);
    }
    if (type === "application" && body.extracted && typeof body.extracted === "object") {
      extracted = body.extracted as Record<string, unknown>;
    }

    const document = await prisma.document.create({
      data: {
        driverId: id,
        type,
        fileName,
        mimeType,
        data: dataUrl,
        extracted: extracted ? JSON.stringify(extracted) : "",
      },
      select: { id: true, type: true, fileName: true, extracted: true, createdAt: true },
    });

    // Auto-fill compliance fields from extraction
    const updates: Record<string, unknown> = {};
    if (extracted) {
      if (type === "cdl") {
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
        if (typeof extracted.endorsements === "string" && !driver.endorsements) {
          updates.endorsements = extracted.endorsements;
        }
      }
      if (type === "medcard" && typeof extracted.expirationDate === "string") {
        const date = new Date(extracted.expirationDate);
        if (!Number.isNaN(date.getTime())) updates.medCardExpiry = date;
      }
    }

    // Advance onboarding to step 2 once documents exist
    if (driver.onboardingStep < 2 && type !== "application") {
      updates.onboardingStep = 2;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.driver.update({ where: { id }, data: updates });
    }

    return NextResponse.json(
      { document, extracted, aiEnabled: isAiConfigured() },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
