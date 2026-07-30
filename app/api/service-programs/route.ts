import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { computeNextDue, programHealth } from "@/src/lib/maintenance";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const { searchParams } = new URL(request.url);
    const truckId = searchParams.get("truckId");

    const programs = await prisma.serviceProgram.findMany({
      where: { companyId, ...(truckId ? { truckId } : {}) },
      orderBy: { name: "asc" },
      include: {
        truck: { select: { id: true, unitNumber: true, mileage: true } },
      },
    });

    return NextResponse.json({
      programs: programs.map((p) => ({ ...p, health: programHealth(p) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const body = await request.json().catch(() => ({}));

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Program name is required." }, { status: 400 });
    }

    if (body.truckId) {
      const truck = await prisma.truck.findFirst({
        where: { id: String(body.truckId), companyId },
      });
      if (!truck) {
        return NextResponse.json({ error: "Truck not found." }, { status: 404 });
      }
    }

    const parseDate = (value: unknown) => {
      if (typeof value !== "string" || !value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const intervalMiles =
      body.intervalMiles != null ? Number(body.intervalMiles) || null : null;
    const intervalDays =
      body.intervalDays != null ? Number(body.intervalDays) || null : null;
    const lastCompletedAt = parseDate(body.lastCompletedAt);
    let nextDueAt = parseDate(body.nextDueAt);
    let nextDueMiles =
      body.nextDueMiles != null ? Number(body.nextDueMiles) || null : null;

    if (!nextDueAt && nextDueMiles == null && (intervalMiles || intervalDays)) {
      const truck = body.truckId
        ? await prisma.truck.findFirst({
            where: { id: String(body.truckId), companyId },
          })
        : null;
      const rolled = computeNextDue({
        completedAt: lastCompletedAt ?? new Date(),
        mileage: truck?.mileage ?? 0,
        intervalMiles,
        intervalDays,
      });
      nextDueAt = rolled.nextDueAt;
      nextDueMiles = rolled.nextDueMiles;
    }

    const program = await prisma.serviceProgram.create({
      data: {
        companyId,
        truckId: body.truckId ? String(body.truckId) : null,
        name,
        intervalMiles,
        intervalDays,
        lastCompletedAt,
        nextDueAt,
        nextDueMiles,
      },
      include: {
        truck: { select: { id: true, unitNumber: true, mileage: true } },
      },
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
