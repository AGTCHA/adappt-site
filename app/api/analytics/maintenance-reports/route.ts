import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

function rangeDays(range: string) {
  if (range === "30d") return 30;
  if (range === "365d") return 365;
  return 90;
}

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const { searchParams } = new URL(request.url);
    const days = rangeDays(searchParams.get("range") ?? "90d");
    const since = new Date(Date.now() - days * 86_400_000);

    const records = await prisma.maintenanceRecord.findMany({
      where: { companyId, date: { gte: since } },
      include: { truck: { select: { id: true, unitNumber: true } } },
    });

    const completedWos = await prisma.workOrder.findMany({
      where: { companyId, status: "completed", completedAt: { gte: since } },
      include: {
        vendor: { select: { id: true, name: true } },
        truck: { select: { id: true, unitNumber: true } },
      },
    });

    const byTruck = new Map<string, { unitNumber: string; spend: number; count: number }>();
    for (const r of records) {
      const entry = byTruck.get(r.truckId) ?? {
        unitNumber: r.truck.unitNumber,
        spend: 0,
        count: 0,
      };
      entry.spend += r.amount;
      entry.count += 1;
      byTruck.set(r.truckId, entry);
    }

    const byVendor = new Map<string, { name: string; spend: number; count: number }>();
    for (const wo of completedWos) {
      const key = wo.vendorId ?? "__none__";
      const name = wo.vendor?.name ?? "No vendor";
      const entry = byVendor.get(key) ?? { name, spend: 0, count: 0 };
      entry.spend += wo.totalAmount;
      entry.count += 1;
      byVendor.set(key, entry);
    }

    return NextResponse.json({
      rangeDays: days,
      totalSpend: records.reduce((s, r) => s + r.amount, 0),
      byTruck: [...byTruck.entries()]
        .map(([id, v]) => ({ truckId: id, ...v }))
        .sort((a, b) => b.spend - a.spend),
      byVendor: [...byVendor.values()].sort((a, b) => b.spend - a.spend),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
