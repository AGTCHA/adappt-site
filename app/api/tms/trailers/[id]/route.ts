import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { EQUIPMENT_TYPES } from "@/src/lib/tms/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.tmsTrailer.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Trailer not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.trailerNumber !== undefined) data.trailerNumber = String(body.trailerNumber).trim();
    if (body.type !== undefined) {
      data.type = (EQUIPMENT_TYPES as readonly string[]).includes(String(body.type))
        ? String(body.type)
        : existing.type;
    }
    if (body.year !== undefined) data.year = body.year ? Number(body.year) || null : null;
    if (body.make !== undefined) data.make = String(body.make).trim();
    if (body.model !== undefined) data.model = String(body.model).trim();
    if (body.vin !== undefined) data.vin = String(body.vin).trim();
    if (body.licensePlate !== undefined) data.licensePlate = String(body.licensePlate).trim();
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const trailer = await prisma.tmsTrailer.update({
      where: { id },
      data,
    });

    return NextResponse.json({ trailer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await context.params;

    const existing = await prisma.tmsTrailer.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Trailer not found." }, { status: 404 });
    }

    await prisma.tmsTrailer.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
