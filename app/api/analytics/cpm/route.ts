import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

const RANGES: Record<string, number | "ytd"> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  ytd: "ytd",
  "12m": 365,
};

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const rangeKey = searchParams.get("range") ?? "30d";
    const range = RANGES[rangeKey] ?? 30;

    const since =
      range === "ytd"
        ? new Date(new Date().getFullYear(), 0, 1)
        : new Date(Date.now() - range * 86_400_000);

    const records = await prisma.maintenanceRecord.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
      select: {
        truckId: true,
        date: true,
        amount: true,
        category: true,
        odometer: true,
        truck: { select: { unitNumber: true } },
      },
    });

    let preventative = 0;
    let accident = 0;
    for (const record of records) {
      if (record.category === "accident") accident += record.amount;
      else preventative += record.amount;
    }
    const total = preventative + accident;

    // Miles tracked: per-truck odometer delta from invoice readings in the range
    const byTruck = new Map<
      string,
      { unitNumber: string; cost: number; minOdo: number | null; maxOdo: number | null }
    >();
    for (const record of records) {
      const entry = byTruck.get(record.truckId) ?? {
        unitNumber: record.truck.unitNumber,
        cost: 0,
        minOdo: null,
        maxOdo: null,
      };
      entry.cost += record.amount;
      if (record.odometer != null) {
        entry.minOdo = entry.minOdo === null ? record.odometer : Math.min(entry.minOdo, record.odometer);
        entry.maxOdo = entry.maxOdo === null ? record.odometer : Math.max(entry.maxOdo, record.odometer);
      }
      byTruck.set(record.truckId, entry);
    }

    let milesTracked = 0;
    const trucks = Array.from(byTruck.entries()).map(([truckId, entry]) => {
      const miles =
        entry.minOdo !== null && entry.maxOdo !== null
          ? entry.maxOdo - entry.minOdo
          : 0;
      milesTracked += miles;
      return {
        truckId,
        unitNumber: entry.unitNumber,
        cost: entry.cost,
        miles,
        cpm: miles > 0 ? (entry.cost / miles) * 100 : null,
      };
    });

    // Monthly buckets for the chart
    const buckets = new Map<string, { preventative: number; accident: number }>();
    for (const record of records) {
      const d = new Date(record.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = buckets.get(key) ?? { preventative: 0, accident: 0 };
      if (record.category === "accident") bucket.accident += record.amount;
      else bucket.preventative += record.amount;
      buckets.set(key, bucket);
    }
    const series = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({ month, ...values }));

    return NextResponse.json({
      range: rangeKey,
      total,
      preventative,
      accident,
      milesTracked,
      cpm: milesTracked > 0 ? (total / milesTracked) * 100 : null,
      trucks: trucks.sort((a, b) => b.cost - a.cost),
      series,
      recordCount: records.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
