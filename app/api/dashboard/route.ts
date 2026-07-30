import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const { companyId } = await requireSession();

    const monthAgo = new Date(Date.now() - 30 * 86_400_000);
    const [
      driverCounts,
      truckCounts,
      unassignedTrucks,
      newLeads,
      activeAds,
      pipelineByStage,
      recentMessages,
      spend30d,
      recentMaintenance,
    ] = await Promise.all([
      prisma.driver.groupBy({
        by: ["status"],
        where: { companyId },
        _count: true,
      }),
      prisma.truck.groupBy({ by: ["status"], where: { companyId }, _count: true }),
      prisma.truck.count({ where: { companyId, driverId: null } }),
      prisma.lead.count({ where: { companyId, disposition: "new" } }),
      prisma.jobAd.count({ where: { companyId, status: "active" } }),
      prisma.driver.groupBy({
        by: ["pipelineStage"],
        where: { companyId, pipelineStage: { notIn: ["denied", "archived"] } },
        _count: true,
      }),
      prisma.message.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { driver: { select: { firstName: true, lastName: true } } },
      }),
      prisma.maintenanceRecord.aggregate({
        where: { companyId, date: { gte: monthAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.maintenanceRecord.findMany({
        where: { companyId },
        orderBy: { date: "desc" },
        take: 4,
        select: {
          id: true,
          date: true,
          vendor: true,
          description: true,
          amount: true,
          category: true,
          truck: { select: { id: true, unitNumber: true } },
        },
      }),
    ]);

    const counts = Object.fromEntries(
      driverCounts.map((c) => [c.status, c._count])
    );
    const tCounts = Object.fromEntries(
      truckCounts.map((c) => [c.status, c._count])
    );
    const truckCount = truckCounts.reduce((sum, c) => sum + c._count, 0);

    const soon = new Date(Date.now() + 30 * 86_400_000);
    const expiring = await prisma.driver.findMany({
      where: {
        companyId,
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
      orderBy: { cdlExpiry: "asc" },
      take: 6,
    });

    return NextResponse.json({
      applicants: counts.applicant ?? 0,
      onboarding: counts.onboarding ?? 0,
      activeDrivers: counts.active ?? 0,
      trucks: truckCount,
      trucksInShop: tCounts.in_shop ?? 0,
      unassignedTrucks,
      newLeads,
      activeAds,
      pipelineByStage,
      spend30d: spend30d._sum.amount ?? 0,
      spend30dCount: spend30d._count,
      recentMaintenance,
      recentMessages,
      expiring,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
