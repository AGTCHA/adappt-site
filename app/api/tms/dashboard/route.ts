import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

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
    ]);

    const countsByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      countsByStatus[row.status] = row._count.id;
    }

    const tasks = [];
    if (unassignedCount > 0) {
      tasks.push({
        type: "unassigned_loads",
        label: `${unassignedCount} unassigned load${unassignedCount === 1 ? "" : "s"}`,
        count: unassignedCount,
        href: "/tms/loads?view=unassigned",
      });
    }
    if (deliveredNoInvoice > 0) {
      tasks.push({
        type: "delivered_no_invoice",
        label: `${deliveredNoInvoice} delivered without invoice`,
        count: deliveredNoInvoice,
        href: "/tms/loads?view=unpaid",
      });
    }
    if (overdueInvoices > 0) {
      tasks.push({
        type: "overdue_invoices",
        label: `${overdueInvoices} overdue invoice${overdueInvoices === 1 ? "" : "s"}`,
        count: overdueInvoices,
        href: "/tms/invoices?view=overdue",
      });
    }

    return NextResponse.json({
      countsByStatus,
      revenueThisWeek: revenueResult._sum.totalRevenue ?? 0,
      outstandingAR: arResult._sum.balance ?? 0,
      unassignedLoads: unassignedCount,
      tasks,
      activeDrivers,
      fleetUnits,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
