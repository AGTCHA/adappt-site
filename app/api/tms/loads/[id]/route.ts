import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  EQUIPMENT_TYPES,
  LOAD_STATUSES,
  LOAD_TRANSITIONS,
  normalizeLoadStatus,
  type LoadStatus,
} from "@/src/lib/tms/constants";
import { computeEconomics, originDestinationFromStops } from "@/src/lib/tms/economics";
import { parseBool, parseDate, parseNumber } from "@/src/lib/tms/parse";
import { randomBytes } from "crypto";

const loadInclude = {
  driver: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    },
  },
  truck: { select: { id: true, unitNumber: true, year: true, make: true, model: true } },
  trailer: { select: { id: true, name: true, trailerNumber: true } },
  customer: true,
  stops: { orderBy: { sequence: "asc" as const } },
  documents: { orderBy: { createdAt: "desc" as const } },
  invoices: { orderBy: { createdAt: "desc" as const }, take: 5 },
  signatures: { orderBy: { createdAt: "desc" as const } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 50 },
};

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;
    const load = await prisma.tmsLoad.findFirst({
      where: { id, companyId },
      include: loadInclude,
    });
    if (!load) {
      return NextResponse.json({ error: "Load not found." }, { status: 404 });
    }
    return NextResponse.json({ load });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.tmsLoad.findFirst({
      where: { id, companyId },
      include: { stops: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Load not found." }, { status: 404 });
    }

    if (body.action === "transition") {
      const next = normalizeLoadStatus(String(body.status));
      const current = normalizeLoadStatus(existing.status);
      const allowed = LOAD_TRANSITIONS[current] ?? [];
      if (!allowed.includes(next)) {
        return NextResponse.json(
          { error: `Cannot transition from ${current} to ${next}.` },
          { status: 400 },
        );
      }
      const load = await prisma.tmsLoad.update({
        where: { id },
        data: { status: next },
        include: loadInclude,
      });
      return NextResponse.json({ load });
    }

    if (body.action === "tracking_link") {
      const token = existing.trackingToken ?? randomBytes(16).toString("hex");
      const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const load = await prisma.tmsLoad.update({
        where: { id },
        data: {
          trackingToken: token,
          trackingTokenExpiresAt: expires,
        },
        include: loadInclude,
      });
      return NextResponse.json({
        load,
        trackingUrl: `/track/${token}`,
        expiresAt: expires.toISOString(),
      });
    }

    const data: Record<string, unknown> = {};

    if (body.status != null) {
      const next = normalizeLoadStatus(String(body.status));
      if ((LOAD_STATUSES as readonly string[]).includes(next)) {
        data.status = next as LoadStatus;
      }
    }

    const stringFields = [
      "customerName",
      "billTo",
      "customerReference",
      "bolNumber",
      "poNumber",
      "proNumber",
      "commodity",
      "hazmatUnNumber",
      "notes",
      "specialInstructions",
      "origin",
      "destination",
      "loadNumber",
      "invoiceStatus",
    ] as const;
    for (const field of stringFields) {
      if (body[field] != null) data[field] = String(body[field]).trim();
    }

    if (body.equipmentType != null) {
      data.equipmentType = (EQUIPMENT_TYPES as readonly string[]).includes(
        String(body.equipmentType),
      )
        ? String(body.equipmentType)
        : existing.equipmentType;
    }

    if (body.hazmat != null) data.hazmat = parseBool(body.hazmat);
    if (body.weight != null) data.weight = parseNumber(body.weight);
    if (body.pieces != null) data.pieces = parseNumber(body.pieces);
    if (body.palletCount != null) data.palletCount = parseNumber(body.palletCount);
    if (body.temperatureMin != null) data.temperatureMin = parseNumber(body.temperatureMin);
    if (body.temperatureMax != null) data.temperatureMax = parseNumber(body.temperatureMax);

    for (const field of [
      "pickupDate",
      "deliveryDate",
      "pickupAppointment",
      "deliveryAppointment",
    ] as const) {
      if (body[field] !== undefined) data[field] = parseDate(body[field]);
    }

    if (body.customerId !== undefined) {
      if (!body.customerId) {
        data.customerId = null;
      } else {
        const customer = await prisma.tmsCustomer.findFirst({
          where: { id: String(body.customerId), companyId },
        });
        if (!customer) {
          return NextResponse.json({ error: "Customer not found." }, { status: 404 });
        }
        data.customerId = customer.id;
        data.customerName = customer.name;
      }
    }

    for (const [field, model] of [
      ["driverId", "driver"],
      ["truckId", "truck"],
      ["trailerId", "tmsTrailer"],
    ] as const) {
      if (body[field] !== undefined) {
        if (!body[field]) {
          data[field] = null;
        } else {
          const row =
            model === "driver"
              ? await prisma.driver.findFirst({
                  where: { id: String(body[field]), companyId },
                })
              : model === "truck"
                ? await prisma.truck.findFirst({
                    where: { id: String(body[field]), companyId },
                  })
                : await prisma.tmsTrailer.findFirst({
                    where: { id: String(body[field]), companyId },
                  });
          if (!row) {
            return NextResponse.json({ error: `${field} not found.` }, { status: 404 });
          }
          data[field] = row.id;
        }
      }
    }

    const econKeys = [
      "linehaulRevenue",
      "fuelSurcharge",
      "accessorialCharges",
      "loadedMiles",
      "emptyMiles",
      "driverPay",
      "fuelCost",
      "tollCost",
      "insuranceCost",
      "otherCosts",
    ] as const;
    const needsEcon = econKeys.some((k) => body[k] != null) || body.rate != null || body.miles != null;
    if (needsEcon) {
      Object.assign(
        data,
        computeEconomics({
          linehaulRevenue: parseNumber(body.linehaulRevenue ?? body.rate) ?? existing.linehaulRevenue,
          fuelSurcharge: parseNumber(body.fuelSurcharge) ?? existing.fuelSurcharge,
          accessorialCharges:
            parseNumber(body.accessorialCharges) ?? existing.accessorialCharges,
          loadedMiles: parseNumber(body.loadedMiles ?? body.miles) ?? existing.loadedMiles,
          emptyMiles: parseNumber(body.emptyMiles) ?? existing.emptyMiles,
          driverPay: parseNumber(body.driverPay) ?? existing.driverPay,
          fuelCost: parseNumber(body.fuelCost) ?? existing.fuelCost,
          tollCost: parseNumber(body.tollCost) ?? existing.tollCost,
          insuranceCost: parseNumber(body.insuranceCost) ?? existing.insuranceCost,
          otherCosts: parseNumber(body.otherCosts) ?? existing.otherCosts,
        }),
      );
    }

    if (Array.isArray(body.stops)) {
      const stops = body.stops.map((stop: Record<string, unknown>, index: number) => ({
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
      const lane = originDestinationFromStops(stops);
      if (!data.origin) data.origin = lane.origin;
      if (!data.destination) data.destination = lane.destination;
      await prisma.$transaction([
        prisma.tmsStop.deleteMany({ where: { loadId: id } }),
        prisma.tmsLoad.update({
          where: { id },
          data: {
            ...data,
            stops: { create: stops },
          },
        }),
      ]);
      const load = await prisma.tmsLoad.findFirst({
        where: { id, companyId },
        include: loadInclude,
      });
      return NextResponse.json({ load });
    }

    const load = await prisma.tmsLoad.update({
      where: { id },
      data,
      include: loadInclude,
    });
    return NextResponse.json({ load });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;
    const existing = await prisma.tmsLoad.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Load not found." }, { status: 404 });
    }
    await prisma.tmsLoad.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
