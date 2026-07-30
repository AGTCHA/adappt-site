import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  ALL_MODULE_IDS,
  MODULES,
  type ModuleId,
  parseEnabledModules,
  serializeEnabledModules,
} from "@/src/lib/modules";

export async function GET() {
  try {
    const session = await requireSession();

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { enabledModules: true },
    });
    if (!company) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    return NextResponse.json({
      enabledModules: parseEnabledModules(company.enabledModules),
      availableModules: ALL_MODULE_IDS,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "owner" && !session.isPlatformAdmin) {
      return NextResponse.json({ error: "Only the company owner can change modules." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const raw = body.enabledModules;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "enabledModules must be an array." }, { status: 400 });
    }

    const modules = raw.filter((id): id is ModuleId => typeof id === "string" && id in MODULES);
    if (modules.length === 0) {
      return NextResponse.json({ error: "At least one module must be enabled." }, { status: 400 });
    }

    const company = await prisma.company.update({
      where: { id: session.companyId },
      data: { enabledModules: serializeEnabledModules(modules) },
      select: { enabledModules: true },
    });

    return NextResponse.json({
      enabledModules: parseEnabledModules(company.enabledModules),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
