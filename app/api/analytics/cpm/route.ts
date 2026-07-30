import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
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
    const { companyId } = await requireModule("fleet");
    const { searchParams } = new URL(request.url);
    const rangeKey = searchParams.get("range") ?? "30d";
    const range = RANGES[rangeKey] ?? 30;

    const since =
      range === "ytd"
        ? new Date(new Date().getFullYear(), 0, 1)
        : new Date(Date.now() - range * 86_400_000);

    const [records, snapshots, trucks] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where: { companyId, date: { gte: since } },
        orderBy: { date: "asc" },
        select: {
          truckId: true,
          date: true,
          amount: true,
          category: true,
          truck: { select: { unitNumber: true } },
        },
      }),
      prisma.odometerSnapshot.findMany({
        where: { companyId, recordedAt: { gte: since } },
        orderBy: { recordedAt: "asc" },
        select: { truckId: true, reading: true, recordedAt: true },
      }),
      prisma.truck.findMany({
        where: { companyId },
        select: { id: true, unitNumber: true, mileage: true },
      }),
    ]);

    let preventative = 0;
    let accident = 0;
    for (const record of records) {
      if (record.category === "accident") accident += record.amount;
      else preventative += record.amount;
    }
    const total = preventative + accident;

    const byTruck = new Map<
      string,
      { unitNumber: string; cost: number; minOdo: number | null; maxOdo: number | null }
    >();

    for (const truck of trucks) {
      byTruck.set(truck.id, {
        unitNumber: truck.unitNumber,
        cost: 0,
        minOdo: truck.mileage || null,
        maxOdo: truck.mileage || null,
      });
    }

    for (const snap of snapshots) {
      const entry = byTruck.get(snap.truckId);
      if (!entry) continue;
      entry.minOdo =
        entry.minOdo === null ? snap.reading : Math.min(entry.minOdo, snap.reading);
      entry.maxOdo =
        entry.maxOdo === null ? snap.reading : Math.max(entry.maxOdo, snap.reading);
    }

    for (const record of records) {
      const entry = byTruck.get(record.truckId);
      if (!entry) continue;
      entry.cost += record.amount;
    }

    let milesTracked = 0;
    const truckRows = Array.from(byTruck.entries()).map(([truckId, entry]) => {
      const miles =
        entry.minOdo !== null && entry.maxOdo !== null && entry.maxOdo > entry.minOdo
          ? entry.maxOdo - entry.minOdo
          : 0;
      milesTracked += miles;
      return {
        truckId,
        unitNumber: entry.unitNumber,
        cost: entry.cost,
        miles,
        cpm: miles > 0 ? (entry.cost / miles) * 100 : null,
        methodology:
          miles > 0
            ? "Based on odometer snapshots in period"
            : "Needs odometer readings (log maintenance with mileage or add snapshots)",
      };
    });

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
      trucks: truckRows.sort((a, b) => b.cost - a.cost),
      series,
      recordCount: records.length,
      snapshotCount: snapshots.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
