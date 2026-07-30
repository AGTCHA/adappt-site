import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

function startOfWeek(iso: string | null): Date {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return startOfWeek(null);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const weekStart = startOfWeek(searchParams.get("weekStart"));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const drivers = await prisma.driver.findMany({
      where: {
        companyId,
        status: { in: ["active", "hired"] },
        archivedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
      },
      orderBy: { lastName: "asc" },
    });

    const loads = await prisma.tmsLoad.findMany({
      where: {
        companyId,
        driverId: { in: drivers.map((d) => d.id) },
        OR: [
          { pickupDate: { gte: weekStart, lt: weekEnd } },
          { deliveryDate: { gte: weekStart, lt: weekEnd } },
          {
            pickupDate: { lt: weekStart },
            deliveryDate: { gte: weekStart },
          },
        ],
      },
      include: {
        truck: { select: { id: true, unitNumber: true } },
        trailer: { select: { id: true, name: true, trailerNumber: true } },
        customer: { select: { id: true, name: true } },
        stops: { orderBy: { sequence: "asc" } },
      },
      orderBy: { pickupDate: "asc" },
    });

    const loadsByDriver = new Map<string, typeof loads>();
    for (const load of loads) {
      if (!load.driverId) continue;
      const arr = loadsByDriver.get(load.driverId) ?? [];
      arr.push(load);
      loadsByDriver.set(load.driverId, arr);
    }

    const result = drivers.map((driver) => ({
      driver,
      loads: loadsByDriver.get(driver.id) ?? [],
    }));

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      drivers: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
