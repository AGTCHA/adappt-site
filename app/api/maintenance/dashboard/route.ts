import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { programHealth } from "@/src/lib/maintenance";

export async function GET() {
  try {
    const { companyId } = await requireModule("fleet");
    const monthAgo = new Date(Date.now() - 30 * 86_400_000);

    const [
      openWos,
      inProgressWos,
      trucksInShop,
      pendingDocs,
      spendAgg,
      programs,
      recentWos,
    ] = await Promise.all([
      prisma.workOrder.count({ where: { companyId, status: "open" } }),
      prisma.workOrder.count({ where: { companyId, status: "in_progress" } }),
      prisma.truck.count({ where: { companyId, status: "in_shop" } }),
      prisma.maintenanceDocument.count({
        where: { companyId, status: { in: ["pending", "reviewed"] } },
      }),
      prisma.maintenanceRecord.aggregate({
        where: { companyId, date: { gte: monthAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.serviceProgram.findMany({
        where: { companyId },
        include: { truck: { select: { id: true, unitNumber: true, mileage: true } } },
      }),
      prisma.workOrder.findMany({
        where: { companyId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          truck: { select: { unitNumber: true } },
          vendor: { select: { name: true } },
        },
      }),
    ]);

    let overduePm = 0;
    let dueSoonPm = 0;
    for (const program of programs) {
      const health = programHealth(program);
      if (health === "overdue") overduePm += 1;
      if (health === "due_soon") dueSoonPm += 1;
    }

    return NextResponse.json({
      openWos,
      inProgressWos,
      trucksInShop,
      pendingDocs,
      spend30d: spendAgg._sum.amount ?? 0,
      invoices30d: spendAgg._count,
      overduePm,
      dueSoonPm,
      recentWos,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
