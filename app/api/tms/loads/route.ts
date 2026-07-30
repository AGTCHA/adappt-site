import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  EQUIPMENT_TYPES,
  LOAD_STATUSES,
  normalizeLoadStatus,
} from "@/src/lib/tms/constants";
import { computeEconomics, originDestinationFromStops } from "@/src/lib/tms/economics";
import { parseBool, parseDate, parseNumber } from "@/src/lib/tms/parse";

const loadInclude = {
  driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
  truck: { select: { id: true, unitNumber: true } },
  trailer: { select: { id: true, name: true, trailerNumber: true } },
  customer: {
    select: { id: true, name: true, contactEmail: true, paymentTerms: true },
  },
  stops: { orderBy: { sequence: "asc" as const } },
  documents: { orderBy: { createdAt: "desc" as const }, take: 20 },
  _count: { select: { invoices: true, messages: true } },
};

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const view = searchParams.get("view");
    const q = searchParams.get("q")?.trim();
    const driverId = searchParams.get("driverId");

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = normalizeLoadStatus(status);
    if (driverId) where.driverId = driverId;

    if (view === "in_transit") where.status = "in_transit";
    if (view === "dispatched" || view === "assigned") where.status = "assigned";
    if (view === "delivered") where.status = "delivered";
    if (view === "unpaid") {
      where.status = "delivered";
      where.invoiceStatus = { in: ["pending", "invoiced", "partial"] };
    }

    if (q) {
      where.OR = [
        { loadNumber: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { origin: { contains: q, mode: "insensitive" } },
        { destination: { contains: q, mode: "insensitive" } },
        { bolNumber: { contains: q, mode: "insensitive" } },
        { customerReference: { contains: q, mode: "insensitive" } },
      ];
    }

    const loads = await prisma.tmsLoad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: loadInclude,
    });

    return NextResponse.json({ loads });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    let loadNumber = String(body.loadNumber ?? "").trim();
    if (!loadNumber) {
      const count = await prisma.tmsLoad.count({ where: { companyId } });
      loadNumber = `LD-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    }

    if (body.driverId) {
      const driver = await prisma.driver.findFirst({
        where: { id: String(body.driverId), companyId },
      });
      if (!driver) {
        return NextResponse.json({ error: "Driver not found." }, { status: 404 });
      }
    }
    if (body.truckId) {
      const truck = await prisma.truck.findFirst({
        where: { id: String(body.truckId), companyId },
      });
      if (!truck) {
        return NextResponse.json({ error: "Truck not found." }, { status: 404 });
      }
    }
    if (body.trailerId) {
      const trailer = await prisma.tmsTrailer.findFirst({
        where: { id: String(body.trailerId), companyId },
      });
      if (!trailer) {
        return NextResponse.json({ error: "Trailer not found." }, { status: 404 });
      }
    }

    const customerId: string | null = body.customerId ? String(body.customerId) : null;
    let customerName = String(body.customerName ?? "").trim();
    if (customerId) {
      const customer = await prisma.tmsCustomer.findFirst({
        where: { id: customerId, companyId },
      });
      if (!customer) {
        return NextResponse.json({ error: "Customer not found." }, { status: 404 });
      }
      customerName = customer.name;
    }

    const stopsRaw: Record<string, unknown>[] = Array.isArray(body.stops) ? body.stops : [];
    const stops = stopsRaw.map((stop, index) => ({
      sequence: Number(stop.sequence) || index,
      type: ["pickup", "delivery", "stop"].includes(String(stop.type))
        ? String(stop.type)
        : "stop",
      locationName: String(stop.locationName ?? "").trim(),
      address: String(stop.address ?? "").trim(),
      city: String(stop.city ?? "").trim(),
      state: String(stop.state ?? "").trim(),
      zip: String(stop.zip ?? "").trim(),
      contactName: String(stop.contactName ?? "").trim(),
      contactPhone: String(stop.contactPhone ?? "").trim(),
      contactEmail: String(stop.contactEmail ?? "").trim(),
      appointmentRequired: parseBool(stop.appointmentRequired),
      appointmentStart: parseDate(stop.appointmentStart),
      appointmentEnd: parseDate(stop.appointmentEnd),
      referenceNumber: String(stop.referenceNumber ?? "").trim(),
      instructions: String(stop.instructions ?? "").trim(),
      scheduledAt: parseDate(stop.scheduledAt ?? stop.appointmentStart),
    }));

    const economics = computeEconomics({
      linehaulRevenue: parseNumber(body.linehaulRevenue ?? body.rate),
      fuelSurcharge: parseNumber(body.fuelSurcharge),
      accessorialCharges: parseNumber(body.accessorialCharges),
      loadedMiles: parseNumber(body.loadedMiles ?? body.miles),
      emptyMiles: parseNumber(body.emptyMiles),
      driverPay: parseNumber(body.driverPay),
      fuelCost: parseNumber(body.fuelCost),
      tollCost: parseNumber(body.tollCost),
      insuranceCost: parseNumber(body.insuranceCost),
      otherCosts: parseNumber(body.otherCosts),
    });

    const lane =
      body.origin || body.destination
        ? {
            origin: String(body.origin ?? "").trim(),
            destination: String(body.destination ?? "").trim(),
          }
        : originDestinationFromStops(stops);

    const hasAssignment = Boolean(body.driverId && body.truckId);
    const requestedStatus = body.status
      ? normalizeLoadStatus(String(body.status))
      : hasAssignment
        ? "assigned"
        : "pending";
    const status = (LOAD_STATUSES as readonly string[]).includes(requestedStatus)
      ? requestedStatus
      : "pending";

    const equipmentType = (EQUIPMENT_TYPES as readonly string[]).includes(
      String(body.equipmentType),
    )
      ? String(body.equipmentType)
      : "dry_van";

    const load = await prisma.tmsLoad.create({
      data: {
        companyId,
        loadNumber,
        status,
        customerId,
        customerName,
        billTo: String(body.billTo ?? "").trim(),
        customerReference: String(body.customerReference ?? "").trim(),
        bolNumber: String(body.bolNumber ?? "").trim(),
        poNumber: String(body.poNumber ?? "").trim(),
        proNumber: String(body.proNumber ?? "").trim(),
        equipmentType,
        commodity: String(body.commodity ?? "").trim(),
        weight: parseNumber(body.weight),
        pieces: parseNumber(body.pieces) != null ? Math.round(Number(body.pieces)) : null,
        palletCount:
          parseNumber(body.palletCount) != null
            ? Math.round(Number(body.palletCount))
            : null,
        hazmat: parseBool(body.hazmat),
        hazmatUnNumber: String(body.hazmatUnNumber ?? "").trim(),
        temperatureMin: parseNumber(body.temperatureMin),
        temperatureMax: parseNumber(body.temperatureMax),
        ...economics,
        driverId: body.driverId ? String(body.driverId) : null,
        truckId: body.truckId ? String(body.truckId) : null,
        trailerId: body.trailerId ? String(body.trailerId) : null,
        origin: lane.origin,
        destination: lane.destination,
        pickupDate: parseDate(body.pickupDate ?? stops.find((s) => s.type === "pickup")?.appointmentStart),
        deliveryDate: parseDate(
          body.deliveryDate ??
            [...stops].reverse().find((s) => s.type === "delivery")?.appointmentStart,
        ),
        pickupAppointment: parseDate(body.pickupAppointment),
        deliveryAppointment: parseDate(body.deliveryAppointment),
        notes: String(body.notes ?? "").trim(),
        specialInstructions: String(body.specialInstructions ?? "").trim(),
        stops: { create: stops },
      },
      include: loadInclude,
    });

    return NextResponse.json({ load }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
