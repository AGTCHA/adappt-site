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
      where.archivedAt = null;
      where.status = { in: ["active", "hired"] };
    }

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { lastName: "asc" },
      include: {
        truck: {
          select: { id: true, unitNumber: true, year: true, make: true, model: true },
        },
        tmsLoads: {
          where: { status: { in: ["assigned", "in_transit", "pending"] } },
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
        _count: { select: { tmsSettlements: true } },
      },
    });

    const roster = drivers.map((d) => {
      const currentLoad = d.tmsLoads[0] ?? null;
      const onLoad = Boolean(
        currentLoad && ["assigned", "in_transit"].includes(currentLoad.status),
      );
      return {
        id: d.id,
        firstName: d.firstName ?? "",
        lastName: d.lastName ?? "",
        phone: d.phone ?? "",
        email: d.email ?? "",
        status: d.status,
        type: d.driverType || "company",
        driverType: d.driverType || "company",
        city: d.city ?? "",
        // US state code for profile; dispatch availability is separate
        state: onLoad ? "on_load" : "available",
        region: d.state ?? "",
        dispatcher: d.dispatcherName || null,
        location: currentLoad
          ? currentLoad.origin || currentLoad.destination || null
          : null,
        hosRemaining: null,
        currentLoadId: currentLoad?.id ?? null,
        currentLoadNumber: currentLoad?.loadNumber ?? null,
        truckUnitNumber: d.truck?.unitNumber ?? null,
        truck: d.truck,
        currentLoad,
        settlementCount: d._count.tmsSettlements,
      };
    });

    return NextResponse.json({ drivers: roster });
  } catch (error) {
    return handleApiError(error);
  }
}
