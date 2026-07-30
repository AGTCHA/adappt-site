import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

/**
 * Safety dashboard. Without telematics, synthesize actionable compliance
 * signals from driver CDL/med-card expiry and in-transit load risk.
 */
export async function GET() {
  try {
    const { companyId } = await requireModule("tms");
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [drivers, inTransit, deliveredWeek] = await Promise.all([
      prisma.driver.findMany({
        where: {
          companyId,
          archivedAt: null,
          OR: [
            { status: { in: ["hired", "active"] } },
            { pipelineStage: { in: ["hired", "onboarding"] } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          cdlExpiry: true,
          medCardExpiry: true,
          phone: true,
        },
      }),
      prisma.tmsLoad.findMany({
        where: { companyId, status: "in_transit" },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
        take: 100,
      }),
      prisma.tmsLoad.count({
        where: {
          companyId,
          status: "delivered",
          deliveryDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const expiringCdl = drivers.filter(
      (d) => d.cdlExpiry && d.cdlExpiry <= in30,
    );
    const expiringMed = drivers.filter(
      (d) => d.medCardExpiry && d.medCardExpiry <= in30,
    );
    const expired = drivers.filter(
      (d) =>
        (d.cdlExpiry && d.cdlExpiry < now) ||
        (d.medCardExpiry && d.medCardExpiry < now),
    );

    const events = [
      ...expired.map((d) => ({
        id: `expired-${d.id}`,
        type: "credential_expired",
        severity: "critical" as const,
        driverName: `${d.firstName} ${d.lastName}`,
        message: "CDL or medical card expired",
        at: now.toISOString(),
      })),
      ...expiringCdl
        .filter((d) => !expired.some((e) => e.id === d.id))
        .map((d) => ({
          id: `cdl-${d.id}`,
          type: "cdl_expiring",
          severity: "warning" as const,
          driverName: `${d.firstName} ${d.lastName}`,
          message: `CDL expires ${d.cdlExpiry?.toISOString().slice(0, 10)}`,
          at: d.cdlExpiry?.toISOString() ?? now.toISOString(),
        })),
      ...expiringMed
        .filter((d) => !expired.some((e) => e.id === d.id))
        .map((d) => ({
          id: `med-${d.id}`,
          type: "med_expiring",
          severity: "warning" as const,
          driverName: `${d.firstName} ${d.lastName}`,
          message: `Medical card expires ${d.medCardExpiry?.toISOString().slice(0, 10)}`,
          at: d.medCardExpiry?.toISOString() ?? now.toISOString(),
        })),
      ...inTransit
        .filter((l) => !l.driverId)
        .map((l) => ({
          id: `orphan-${l.id}`,
          type: "unassigned_in_transit",
          severity: "critical" as const,
          driverName: "—",
          message: `Load ${l.loadNumber} in transit with no driver`,
          at: l.updatedAt.toISOString(),
        })),
    ];

    return NextResponse.json({
      summary: {
        eventsThisWeek: events.length,
        atRiskDrivers: new Set(events.map((e) => e.driverName)).size,
        inTransitLoads: inTransit.length,
        deliveredThisWeek: deliveredWeek,
        telematicsConnected: false,
      },
      events,
      coaching: [],
      note: "Connect Samsara/Motive in TMS Settings to unlock harsh driving, speeding, and dashcam events.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
