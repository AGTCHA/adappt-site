import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

const ALLOWED_FIELDS = [
  "dotNumber",
  "mcNumber",
  "scac",
  "factorCompanyName",
  "factorSubmitEmail",
  "remitToName",
  "remitToAddress",
  "remitToCity",
  "remitToState",
  "remitToZip",
  "noticeOfAssignment",
  "telematicsProvider",
  "highwayApiKey",
  "highwayEnv",
] as const;

export async function GET() {
  try {
    const { companyId } = await requireModule("tms");

    let settings = await prisma.tmsCompanySettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await prisma.tmsCompanySettings.create({
        data: { companyId },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const data: Record<string, string> = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) {
        data[key] = String(body[key]).trim();
      }
    }

    const settings = await prisma.tmsCompanySettings.upsert({
      where: { companyId },
      create: { companyId, ...data },
      update: data,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
