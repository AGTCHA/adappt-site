import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { SETTLEMENT_STATUSES } from "@/src/lib/tms/constants";
import { computeLoadDriverPay } from "@/src/lib/tms/pay";
import { parseDate, nextNumber } from "@/src/lib/tms/parse";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const driverId = searchParams.get("driverId");

    const where: Record<string, unknown> = { companyId };
    if (status && (SETTLEMENT_STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }
    if (driverId) where.driverId = driverId;

    const settlements = await prisma.tmsSettlement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { lines: true, adjustments: true } },
      },
    });

    return NextResponse.json({ settlements });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, userId, name: userName } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const driverId = String(body.driverId ?? "").trim();
    if (!driverId) {
      return NextResponse.json({ error: "driverId is required." }, { status: 400 });
    }

    const driver = await prisma.driver.findFirst({ where: { id: driverId, companyId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const periodStart = parseDate(body.periodStart);
    const periodEnd = parseDate(body.periodEnd);
    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: "periodStart and periodEnd are required." }, { status: 400 });
    }

    const loads = await prisma.tmsLoad.findMany({
      where: {
        companyId,
        driverId,
        status: "delivered",
        deliveryDate: { gte: periodStart, lte: periodEnd },
      },
      include: { stops: true },
      orderBy: { deliveryDate: "asc" },
    });

    const payRule = await prisma.tmsDriverPayRule.findFirst({
      where: { companyId, driverId, isActive: true },
      orderBy: { effectiveFrom: "desc" },
    }) ?? await prisma.tmsDriverPayRule.findFirst({
      where: { companyId, driverId: null, isActive: true },
      orderBy: { effectiveFrom: "desc" },
    });

    const settlementCount = await prisma.tmsSettlement.count({ where: { companyId } });
    const settlementNumber = nextNumber("STL", settlementCount + 1);

    const settlement = await prisma.$transaction(async (tx) => {
      const lines: {
        loadId: string | null;
        lineType: string;
        description: string;
        quantity: number;
        rate: number;
        amount: number;
      }[] = [];

      let totalMilesLoaded = 0;
      let totalMilesEmpty = 0;
      let grossPay = 0;

      for (const load of loads) {
        const driverPay = computeLoadDriverPay(payRule, {
          linehaulRevenue: load.linehaulRevenue,
          fuelSurcharge: load.fuelSurcharge,
          loadedMiles: load.loadedMiles,
          emptyMiles: load.emptyMiles,
          stopCount: load.stops?.length ?? 2,
        });

        lines.push({
          loadId: load.id,
          lineType: "load_pay",
          description: `${load.loadNumber} — ${load.origin} → ${load.destination}`,
          quantity: 1,
          rate: driverPay,
          amount: driverPay,
        });

        totalMilesLoaded += load.loadedMiles;
        totalMilesEmpty += load.emptyMiles;
        grossPay += driverPay;
      }

      const recurringItems = await tx.tmsRecurringItem.findMany({
        where: {
          companyId,
          driverId,
          isActive: true,
          startDate: { lte: periodEnd },
          OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
        },
        include: { escrowAccount: true },
      });

      let deductions = 0;

      for (const item of recurringItems) {
        let amount: number;
        if (item.pctOfGross != null && item.pctOfGross > 0) {
          amount = Math.round(grossPay * (item.pctOfGross / 100) * 100) / 100;
        } else {
          amount = item.amount ?? 0;
        }

        if (amount <= 0) continue;

        lines.push({
          loadId: null,
          lineType: "deduction",
          description: item.description,
          quantity: 1,
          rate: -amount,
          amount: -amount,
        });
        deductions += amount;

        if (item.escrowAccountId && item.escrowAccount) {
          const newBalance = item.escrowAccount.balance + amount;
          await tx.tmsEscrowAccount.update({
            where: { id: item.escrowAccountId },
            data: { balance: newBalance },
          });
          await tx.tmsEscrowTxn.create({
            data: {
              escrowAccountId: item.escrowAccountId,
              amount,
              balanceAfter: newBalance,
              description: `Settlement deduction: ${item.description}`,
              createdBy: userName || userId,
            },
          });
        }

        if (item.remainingBalance != null) {
          const newRemaining = Math.max(0, item.remainingBalance - amount);
          await tx.tmsRecurringItem.update({
            where: { id: item.id },
            data: {
              remainingBalance: newRemaining,
              isActive: newRemaining > 0,
            },
          });
        }
      }

      const unappliedAdjustments = await tx.tmsSettlementAdjustment.findMany({
        where: { companyId, driverId, settlementId: null },
      });

      for (const adj of unappliedAdjustments) {
        lines.push({
          loadId: null,
          lineType: "adjustment",
          description: adj.description,
          quantity: 1,
          rate: adj.amount,
          amount: adj.amount,
        });
        if (adj.amount < 0) deductions += Math.abs(adj.amount);
        else grossPay += adj.amount;
      }

      const netPay = grossPay - deductions;

      const stl = await tx.tmsSettlement.create({
        data: {
          companyId,
          driverId,
          settlementNumber,
          periodStart,
          periodEnd,
          loadCount: loads.length,
          totalMilesLoaded,
          totalMilesEmpty,
          grossPay,
          deductions,
          netPay,
          status: "draft",
          lines: { create: lines },
        },
        include: {
          lines: { orderBy: { createdAt: "asc" } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (unappliedAdjustments.length > 0) {
        await tx.tmsSettlementAdjustment.updateMany({
          where: { id: { in: unappliedAdjustments.map((a) => a.id) } },
          data: { settlementId: stl.id },
        });
      }

      return stl;
    });

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
