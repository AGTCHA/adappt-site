import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const userId = await requireUserId();
    const trucks = await prisma.truck.findMany({
      where: { userId },
      orderBy: { unitNumber: "asc" },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        maintenance: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true, category: true, description: true },
        },
      },
    });
    return NextResponse.json({ trucks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json().catch(() => ({}));

    const unitNumber = String(body.unitNumber ?? "").trim();
    const year = Number(body.year);
    const make = String(body.make ?? "").trim();
    const model = String(body.model ?? "").trim();

    if (!unitNumber || !make || !model || !Number.isFinite(year)) {
      return NextResponse.json(
        { error: "Unit number, year, make, and model are required." },
        { status: 400 }
      );
    }

    const truck = await prisma.truck.create({
      data: {
        userId,
        unitNumber,
        year,
        make,
        model,
        vin: String(body.vin ?? "").trim(),
        mileage: Number(body.mileage) || 0,
        status: ["active", "in_shop", "inactive"].includes(body.status)
          ? body.status
          : "active",
      },
    });

    return NextResponse.json({ truck }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
