import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { ModuleError, requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

async function requireFleetOrTms() {
  const session = await requireSession();
  const ok =
    session.isPlatformAdmin ||
    session.enabledModules.includes("fleet") ||
    session.enabledModules.includes("tms");
  if (!ok) throw new ModuleError("fleet");
  return session;
}

export async function GET() {
  try {
    const { companyId } = await requireFleetOrTms();
    const rows = await prisma.truck.findMany({
      where: { companyId },
      orderBy: { unitNumber: "asc" },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        tmsLoads: {
          where: { status: { in: ["assigned", "in_transit"] } },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { id: true, loadNumber: true, status: true },
        },
        maintenance: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true, category: true, description: true },
        },
      },
    });

    const trucks = rows.map((t) => ({
      ...t,
      assignedDriver: t.driver,
      currentLoad: t.tmsLoads[0] ?? null,
      latitude: null as number | null,
      longitude: null as number | null,
      lastLocationUpdate: null as string | null,
    }));

    return NextResponse.json({ trucks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireFleetOrTms();
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
        companyId,
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
