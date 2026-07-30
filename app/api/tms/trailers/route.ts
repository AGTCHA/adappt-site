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

    const trailers = await prisma.tmsTrailer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { loads: true } },
      },
    });

    return NextResponse.json({ trailers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Trailer name is required." }, { status: 400 });
    }

    const type = (EQUIPMENT_TYPES as readonly string[]).includes(String(body.type))
      ? String(body.type)
      : "dry_van";

    const trailer = await prisma.tmsTrailer.create({
      data: {
        companyId,
        name,
        trailerNumber: String(body.trailerNumber ?? "").trim(),
        type,
        year: body.year ? Number(body.year) || null : null,
        make: String(body.make ?? "").trim(),
        model: String(body.model ?? "").trim(),
        vin: String(body.vin ?? "").trim(),
        licensePlate: String(body.licensePlate ?? "").trim(),
      },
    });

    return NextResponse.json({ trailer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
