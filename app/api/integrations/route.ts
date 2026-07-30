import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

function canManageIntegrations(role: string, isPlatformAdmin: boolean) {
  return isPlatformAdmin || role === "owner" || role === "admin";
}

export async function GET() {
  try {
    const session = await requireSession();
    if (!canManageIntegrations(session.role, session.isPlatformAdmin)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const credentials = await prisma.integrationCredential.findMany({
      where: { companyId: session.companyId },
      select: {
        id: true,
        provider: true,
        encryptedPayload: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const integrations = credentials.map((cred) => {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(cred.encryptedPayload) as Record<string, unknown>;
      } catch {
        payload = {};
      }
      const masked: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (typeof value === "string" && (key.includes("secret") || key.includes("token") || key.includes("key"))) {
          masked[key] = value.length > 4 ? `••••${value.slice(-4)}` : "••••";
        } else {
          masked[key] = value;
        }
      }
      return {
        id: cred.id,
        provider: cred.provider,
        config: masked,
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt,
      };
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    if (!canManageIntegrations(session.role, session.isPlatformAdmin)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const provider = String(body.provider ?? "").trim();
    if (!provider) {
      return NextResponse.json({ error: "Provider is required." }, { status: 400 });
    }

    const config = body.config && typeof body.config === "object" ? body.config : body;
    const encryptedPayload = JSON.stringify(config);

    const credential = await prisma.integrationCredential.upsert({
      where: {
        companyId_provider: {
          companyId: session.companyId,
          provider,
        },
      },
      create: {
        companyId: session.companyId,
        provider,
        encryptedPayload,
      },
      update: {
        encryptedPayload,
      },
      select: {
        id: true,
        provider: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ credential });
  } catch (error) {
    return handleApiError(error);
  }
}
