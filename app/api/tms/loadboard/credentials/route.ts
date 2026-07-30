import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { LOADBOARD_PROVIDERS } from "@/src/lib/tms/constants";

export async function GET() {
  try {
    const { companyId } = await requireModule("tms");

    const credentials = await prisma.tmsLoadboardCredential.findMany({
      where: { companyId },
      orderBy: { provider: "asc" },
    });

    const safe = credentials.map((c) => ({
      ...c,
      credentialsJson: undefined,
      hasCredentials: c.credentialsJson !== "{}",
    }));

    return NextResponse.json({ credentials: safe });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const provider = String(body.provider ?? "").trim();
    if (!(LOADBOARD_PROVIDERS as readonly string[]).includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${LOADBOARD_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }

    let credentialsJson = "{}";
    if (body.credentials && typeof body.credentials === "object") {
      try {
        credentialsJson = JSON.stringify(body.credentials);
      } catch {
        /* keep default */
      }
    }

    const credential = await prisma.tmsLoadboardCredential.upsert({
      where: { companyId_provider: { companyId, provider } },
      create: {
        companyId,
        provider,
        label: String(body.label ?? "").trim(),
        isEnabled: body.isEnabled !== false,
        credentialsJson,
        lastTestAt: new Date(),
        lastTestOk: true,
      },
      update: {
        label: String(body.label ?? "").trim(),
        isEnabled: body.isEnabled !== false,
        credentialsJson,
        lastTestAt: new Date(),
        lastTestOk: true,
      },
    });

    return NextResponse.json({
      credential: {
        ...credential,
        credentialsJson: undefined,
        hasCredentials: true,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const provider = String(body.provider ?? "").trim();
    if (!(LOADBOARD_PROVIDERS as readonly string[]).includes(provider)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    const existing = await prisma.tmsLoadboardCredential.findUnique({
      where: { companyId_provider: { companyId, provider } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Credential not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.label !== undefined) data.label = String(body.label).trim();
    if (body.isEnabled !== undefined) data.isEnabled = Boolean(body.isEnabled);
    if (body.credentials !== undefined && typeof body.credentials === "object") {
      try {
        data.credentialsJson = JSON.stringify(body.credentials);
        data.lastTestAt = new Date();
        data.lastTestOk = true;
      } catch {
        /* skip */
      }
    }

    const credential = await prisma.tmsLoadboardCredential.update({
      where: { companyId_provider: { companyId, provider } },
      data,
    });

    return NextResponse.json({
      credential: {
        ...credential,
        credentialsJson: undefined,
        hasCredentials: credential.credentialsJson !== "{}",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
