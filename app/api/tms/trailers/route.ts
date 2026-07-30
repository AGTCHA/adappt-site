import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { EQUIPMENT_TYPES } from "@/src/lib/tms/constants";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const where: Record<string, unknown> = { companyId };
    if (!includeArchived) where.isActive = true;

    const rows = await prisma.tmsTrailer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { loads: true } },
      },
    });

    const trailers = rows.map((t) => ({
      ...t,
      unitNumber: t.trailerNumber || t.name,
      status: t.isActive ? "active" : "inactive",
      length: null as number | null,
    }));

    return NextResponse.json({ trailers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const unit =
      String(body.unitNumber ?? body.trailerNumber ?? body.name ?? "").trim();
    if (!unit) {
      return NextResponse.json(
        { error: "Trailer unit number is required." },
        { status: 400 },
      );
    }

    const type = (EQUIPMENT_TYPES as readonly string[]).includes(String(body.type))
      ? String(body.type)
      : "dry_van";

    const created = await prisma.tmsTrailer.create({
      data: {
        companyId,
        name: unit,
        trailerNumber: unit,
        type,
        year: body.year ? Number(body.year) || null : null,
        make: String(body.make ?? "").trim(),
        model: String(body.model ?? "").trim(),
        vin: String(body.vin ?? "").trim(),
        licensePlate: String(body.licensePlate ?? "").trim(),
        isActive: body.status !== "inactive" && body.isActive !== false,
      },
    });

    const trailer = {
      ...created,
      unitNumber: created.trailerNumber || created.name,
      status: created.isActive ? "active" : "inactive",
      length: null as number | null,
    };

    return NextResponse.json({ trailer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
