import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { LOAD_STATUSES } from "@/src/lib/tms/constants";

export async function GET() {
  try {
    const { companyId } = await requireModule("tms");

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      statusCounts,
      revenueResult,
      arResult,
      unassignedCount,
      deliveredNoInvoice,
      overdueInvoices,
      activeDrivers,
      fleetUnits,
      deliveredThisWeek,
    ] = await Promise.all([
      prisma.tmsLoad.groupBy({
        by: ["status"],
        where: { companyId },
        _count: { id: true },
      }),

      prisma.tmsLoad.aggregate({
        where: {
          companyId,
          status: "delivered",
          OR: [
            { pickupDate: { gte: weekAgo } },
            { deliveryDate: { gte: weekAgo } },
          ],
        },
        _sum: { totalRevenue: true },
      }),

      prisma.tmsInvoice.aggregate({
        where: {
          companyId,
          status: { in: ["invoiced", "partial"] },
        },
        _sum: { balance: true },
      }),

      prisma.tmsLoad.count({
        where: { companyId, status: "pending", driverId: null },
      }),

      prisma.tmsLoad.count({
        where: {
          companyId,
          status: "delivered",
          invoiceStatus: "pending",
        },
      }),

      prisma.tmsInvoice.count({
        where: {
          companyId,
          status: { in: ["invoiced", "partial"] },
          dueDate: { lt: now },
        },
      }),

      prisma.driver.count({
        where: {
          companyId,
          status: { in: ["active", "hired"] },
          archivedAt: null,
        },
      }),

      prisma.truck.count({
        where: { companyId, status: { not: "retired" } },
      }),

      prisma.tmsLoad.count({
        where: {
          companyId,
          status: "delivered",
          OR: [
            { pickupDate: { gte: weekAgo } },
            { deliveryDate: { gte: weekAgo } },
          ],
        },
      }),
    ]);

    const countsByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      countsByStatus[row.status] = row._count.id;
    }

    const activeLoads =
      (countsByStatus.pending ?? 0) +
      (countsByStatus.assigned ?? 0) +
      (countsByStatus.in_transit ?? 0) +
      (countsByStatus.draft ?? 0) +
      (countsByStatus.dispatched ?? 0);

    const pipeline = LOAD_STATUSES.map((status) => ({
      status,
      count: countsByStatus[status] ?? 0,
    }));

    const tasks: {
      id: string;
      title: string;
      link: string;
      priority: string;
    }[] = [];

    if (unassignedCount > 0) {
      tasks.push({
        id: "unassigned_loads",
        title: `${unassignedCount} unassigned load${unassignedCount === 1 ? "" : "s"}`,
        link: "/tms/loads?view=pending",
        priority: "high",
      });
    }
    if (deliveredNoInvoice > 0) {
      tasks.push({
        id: "delivered_no_invoice",
        title: `${deliveredNoInvoice} delivered without invoice`,
        link: "/tms/loads?view=unpaid",
        priority: "medium",
      });
    }
    if (overdueInvoices > 0) {
      tasks.push({
        id: "overdue_invoices",
        title: `${overdueInvoices} overdue invoice${overdueInvoices === 1 ? "" : "s"}`,
        link: "/tms/invoices?status=invoiced",
        priority: "high",
      });
    }

    return NextResponse.json({
      stats: {
        activeLoads,
        deliveredThisWeek,
        revenueThisWeek: revenueResult._sum.totalRevenue ?? 0,
        outstandingAR: arResult._sum.balance ?? 0,
      },
      tasks,
      pipeline,
      // keep extras for future widgets
      countsByStatus,
      unassignedLoads: unassignedCount,
      activeDrivers,
      fleetUnits,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
