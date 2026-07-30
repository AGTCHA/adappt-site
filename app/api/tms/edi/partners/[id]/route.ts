import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.tmsEdiPartner.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "EDI partner not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.scac !== undefined) data.scac = String(body.scac).trim();
    if (body.transport !== undefined) {
      data.transport = ["sftp", "as2", "api", "email"].includes(String(body.transport))
        ? String(body.transport)
        : existing.transport;
    }
    if (body.isEnabled !== undefined) data.isEnabled = Boolean(body.isEnabled);
    if (body.config !== undefined && typeof body.config === "object") {
      try {
        data.configJson = JSON.stringify(body.config);
      } catch {
        /* keep existing */
      }
    }

    if (body.resetCircuit === true) {
      data.circuitOpen = false;
    }

    const partner = await prisma.tmsEdiPartner.update({
      where: { id },
      data,
    });

    return NextResponse.json({ partner });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await context.params;

    const existing = await prisma.tmsEdiPartner.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "EDI partner not found." }, { status: 404 });
    }

    await prisma.tmsEdiPartner.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
