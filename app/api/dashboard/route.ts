import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const userId = await requireUserId();

    const [driverCounts, truckCount, newLeads, activeAds, recentMessages] =
      await Promise.all([
        prisma.driver.groupBy({
          by: ["status"],
          where: { userId },
          _count: true,
        }),
        prisma.truck.count({ where: { userId } }),
        prisma.lead.count({ where: { userId, status: "new" } }),
        prisma.jobAd.count({ where: { userId, status: "active" } }),
        prisma.message.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { driver: { select: { firstName: true, lastName: true } } },
        }),
      ]);

    const counts = Object.fromEntries(
      driverCounts.map((c) => [c.status, c._count])
    );

    // Compliance alerts: expiring CDL / med cards within 30 days
    const soon = new Date(Date.now() + 30 * 86_400_000);
    const expiring = await prisma.driver.findMany({
      where: {
        userId,
        status: { in: ["active", "onboarding"] },
        OR: [
          { cdlExpiry: { lte: soon, not: null } },
          { medCardExpiry: { lte: soon, not: null } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        cdlExpiry: true,
        medCardExpiry: true,
      },
      take: 5,
    });

    return NextResponse.json({
      applicants: counts.applicant ?? 0,
      onboarding: counts.onboarding ?? 0,
      activeDrivers: counts.active ?? 0,
      trucks: truckCount,
      newLeads,
      activeAds,
      recentMessages,
      expiring,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
