import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const where: Record<string, unknown> = { companyId };
    if (!includeArchived) {
      where.OR = [
        { status: { in: ["active", "hired", "applicant", "orientation"] } },
        { archivedAt: null },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { lastName: "asc" },
      include: {
        truck: { select: { id: true, unitNumber: true, year: true, make: true, model: true } },
        tmsLoads: {
          where: { status: { in: ["assigned", "in_transit"] } },
          orderBy: { pickupDate: "desc" },
          take: 1,
          select: {
            id: true,
            loadNumber: true,
            status: true,
            origin: true,
            destination: true,
            pickupDate: true,
            deliveryDate: true,
          },
        },
        _count: {
          select: { tmsSettlements: true },
        },
      },
    });

    const roster = drivers.map((d) => ({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      email: d.email,
      status: d.status,
      driverType: d.driverType,
      city: d.city,
      state: d.state,
      cdlNumber: d.cdlNumber,
      cdlState: d.cdlState,
      cdlExpiry: d.cdlExpiry,
      medCardExpiry: d.medCardExpiry,
      archivedAt: d.archivedAt,
      truck: d.truck,
      currentLoad: d.tmsLoads[0] ?? null,
      settlementCount: d._count.tmsSettlements,
    }));

    return NextResponse.json({ drivers: roster });
  } catch (error) {
    return handleApiError(error);
  }
}
