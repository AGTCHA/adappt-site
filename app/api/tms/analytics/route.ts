import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

function periodRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  switch (period) {
    case "7d":
      start = new Date(now.getTime() - 7 * 86400000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 86400000);
      break;
    case "quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      break;
    }
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getTime() - 30 * 86400000);
  }

  return { start, end };
}

async function financialTab(companyId: string, start: Date, end: Date) {
  const loads = await prisma.tmsLoad.findMany({
    where: {
      companyId,
      status: "delivered",
      deliveryDate: { gte: start, lte: end },
    },
    include: {
      customer: { select: { id: true, name: true } },
      driver: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const totalRevenue = loads.reduce((s, l) => s + l.totalRevenue, 0);
  const totalCost = loads.reduce((s, l) => s + l.totalCost, 0);
  const grossMargin = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

  const customerMap = new Map<string, { name: string; revenue: number; loads: number }>();
  for (const load of loads) {
    const key = load.customerId ?? "unknown";
    const entry = customerMap.get(key) ?? {
      name: load.customerName || load.customer?.name || "Unknown",
      revenue: 0,
      loads: 0,
    };
    entry.revenue += load.totalRevenue;
    entry.loads += 1;
    customerMap.set(key, entry);
  }
  const topCustomers = [...customerMap.entries()]
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const driverMap = new Map<string, { name: string; revenue: number; loads: number; miles: number }>();
  for (const load of loads) {
    if (!load.driverId) continue;
    const key = load.driverId;
    const entry = driverMap.get(key) ?? {
      name: load.driver ? `${load.driver.firstName} ${load.driver.lastName}` : "Unknown",
      revenue: 0,
      loads: 0,
      miles: 0,
    };
    entry.revenue += load.totalRevenue;
    entry.loads += 1;
    entry.miles += load.totalMiles;
    driverMap.set(key, entry);
  }
  const driverPerformance = [...driverMap.entries()]
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const dailyMap = new Map<string, { revenue: number; cost: number; loads: number }>();
  for (const load of loads) {
    const day = (load.deliveryDate ?? load.createdAt).toISOString().slice(0, 10);
    const entry = dailyMap.get(day) ?? { revenue: 0, cost: 0, loads: 0 };
    entry.revenue += load.totalRevenue;
    entry.cost += load.totalCost;
    entry.loads += 1;
    dailyMap.set(day, entry);
  }
  const dailyTrend = [...dailyMap.entries()]
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { totalRevenue, totalCost, grossMargin, marginPct, topCustomers, driverPerformance, dailyTrend };
}

async function lanesTab(companyId: string, start: Date, end: Date) {
  const loads = await prisma.tmsLoad.findMany({
    where: {
      companyId,
      status: "delivered",
      deliveryDate: { gte: start, lte: end },
    },
    select: {
      origin: true,
      destination: true,
      totalRevenue: true,
      totalCost: true,
      totalMiles: true,
    },
  });

  const laneMap = new Map<string, {
    origin: string; destination: string;
    volume: number; revenue: number; cost: number; miles: number;
  }>();

  for (const load of loads) {
    const key = `${load.origin}→${load.destination}`;
    const entry = laneMap.get(key) ?? {
      origin: load.origin,
      destination: load.destination,
      volume: 0,
      revenue: 0,
      cost: 0,
      miles: 0,
    };
    entry.volume += 1;
    entry.revenue += load.totalRevenue;
    entry.cost += load.totalCost;
    entry.miles += load.totalMiles;
    laneMap.set(key, entry);
  }

  const lanes = [...laneMap.values()]
    .map((l) => ({
      ...l,
      margin: l.revenue - l.cost,
      marginPct: l.revenue > 0 ? ((l.revenue - l.cost) / l.revenue) * 100 : 0,
      avgRate: l.volume > 0 ? l.revenue / l.volume : 0,
    }))
    .sort((a, b) => b.volume - a.volume);

  return { lanes };
}

async function fuelTab(companyId: string, start: Date, end: Date) {
  const loads = await prisma.tmsLoad.findMany({
    where: {
      companyId,
      status: "delivered",
      deliveryDate: { gte: start, lte: end },
    },
    select: { fuelCost: true, fuelSurcharge: true, totalMiles: true },
  });

  const totalFuelCost = loads.reduce((s, l) => s + l.fuelCost, 0);
  const totalFuelSurcharge = loads.reduce((s, l) => s + l.fuelSurcharge, 0);
  const totalMiles = loads.reduce((s, l) => s + l.totalMiles, 0);
  const costPerMile = totalMiles > 0 ? totalFuelCost / totalMiles : 0;
  const surchargeRecovery = totalFuelCost > 0 ? (totalFuelSurcharge / totalFuelCost) * 100 : 0;

  return {
    totalFuelCost,
    totalFuelSurcharge,
    totalMiles,
    costPerMile,
    surchargeRecovery,
    note: "Detailed fuel card data requires telematics integration.",
  };
}

async function iftaTab(companyId: string, start: Date, end: Date) {
  const loads = await prisma.tmsLoad.findMany({
    where: {
      companyId,
      status: "delivered",
      deliveryDate: { gte: start, lte: end },
    },
    select: { origin: true, destination: true, totalMiles: true, fuelCost: true },
  });

  const stateMap = new Map<string, { miles: number; gallons: number }>();
  for (const load of loads) {
    for (const loc of [load.origin, load.destination]) {
      const state = loc.split(",").pop()?.trim() || "Unknown";
      const entry = stateMap.get(state) ?? { miles: 0, gallons: 0 };
      entry.miles += load.totalMiles / 2;
      entry.gallons += load.fuelCost > 0 ? (load.fuelCost / 4.0) / 2 : 0;
      stateMap.set(state, entry);
    }
  }

  const byState = [...stateMap.entries()]
    .map(([state, data]) => ({
      state,
      miles: Math.round(data.miles),
      gallons: Math.round(data.gallons),
      mpg: data.gallons > 0 ? Math.round((data.miles / data.gallons) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.miles - a.miles);

  return {
    byState,
    note: "IFTA estimates are based on load origin/destination. For exact reporting, integrate telematics/fuel card data.",
  };
}

async function efficiencyTab(companyId: string, start: Date, end: Date) {
  const loads = await prisma.tmsLoad.findMany({
    where: {
      companyId,
      status: "delivered",
      deliveryDate: { gte: start, lte: end },
    },
    select: {
      totalMiles: true,
      loadedMiles: true,
      emptyMiles: true,
      totalRevenue: true,
      pickupDate: true,
      deliveryDate: true,
    },
  });

  const trucks = await prisma.truck.count({
    where: { companyId, status: { not: "retired" } },
  });

  const totalMiles = loads.reduce((s, l) => s + l.totalMiles, 0);
  const loadedMiles = loads.reduce((s, l) => s + l.loadedMiles, 0);
  const emptyMiles = loads.reduce((s, l) => s + l.emptyMiles, 0);
  const deadheadPct = totalMiles > 0 ? (emptyMiles / totalMiles) * 100 : 0;
  const revenuePerMile = totalMiles > 0
    ? loads.reduce((s, l) => s + l.totalRevenue, 0) / totalMiles
    : 0;
  const loadsPerTruck = trucks > 0 ? loads.length / trucks : loads.length;

  const periodDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  const revenuePerTruckPerDay = trucks > 0
    ? loads.reduce((s, l) => s + l.totalRevenue, 0) / trucks / periodDays
    : 0;

  return {
    totalLoads: loads.length,
    totalMiles,
    loadedMiles,
    emptyMiles,
    deadheadPct: Math.round(deadheadPct * 10) / 10,
    revenuePerMile: Math.round(revenuePerMile * 100) / 100,
    loadsPerTruck: Math.round(loadsPerTruck * 10) / 10,
    revenuePerTruckPerDay: Math.round(revenuePerTruckPerDay),
    activeTrucks: trucks,
    idleRate: 0,
    idleNote: "Idle time tracking requires telematics integration.",
  };
}

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);

    const tab = searchParams.get("tab") ?? "financial";
    const period = searchParams.get("period") ?? "30d";
    const { start, end } = periodRange(period);

    let data: unknown;

    switch (tab) {
      case "financial":
        data = await financialTab(companyId, start, end);
        break;
      case "lanes":
        data = await lanesTab(companyId, start, end);
        break;
      case "fuel":
        data = await fuelTab(companyId, start, end);
        break;
      case "ifta":
        data = await iftaTab(companyId, start, end);
        break;
      case "efficiency":
        data = await efficiencyTab(companyId, start, end);
        break;
      default:
        return NextResponse.json({ error: "Invalid tab." }, { status: 400 });
    }

    return NextResponse.json({
      tab,
      period,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      ...data as Record<string, unknown>,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
