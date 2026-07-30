import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { computeNextDue, markProgramServiced } from "@/src/lib/maintenance";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.serviceProgram.findFirst({
      where: { id, companyId },
      include: { truck: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 });
    }

    if (body.action === "mark_serviced") {
      const program = await markProgramServiced(companyId, id, {
        mileage: body.mileage != null ? Number(body.mileage) : undefined,
      });
      return NextResponse.json({ program });
    }

    const parseDate = (value: unknown) => {
      if (typeof value !== "string" || !value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (body.intervalMiles !== undefined) {
      data.intervalMiles =
        body.intervalMiles == null ? null : Number(body.intervalMiles) || null;
    }
    if (body.intervalDays !== undefined) {
      data.intervalDays =
        body.intervalDays == null ? null : Number(body.intervalDays) || null;
    }
    if ("truckId" in body) {
      if (body.truckId === null || body.truckId === "") {
        data.truckId = null;
      } else {
        const truck = await prisma.truck.findFirst({
          where: { id: String(body.truckId), companyId },
        });
        if (!truck) {
          return NextResponse.json({ error: "Truck not found." }, { status: 404 });
        }
        data.truckId = truck.id;
      }
    }
    if (body.lastCompletedAt !== undefined) {
      data.lastCompletedAt = parseDate(body.lastCompletedAt);
    }
    if (body.nextDueAt !== undefined) data.nextDueAt = parseDate(body.nextDueAt);
    if (body.nextDueMiles !== undefined) {
      data.nextDueMiles =
        body.nextDueMiles == null ? null : Number(body.nextDueMiles) || null;
    }

    // Auto-seed next due when intervals change and no due set
    const intervalMiles =
      (data.intervalMiles as number | null | undefined) ?? existing.intervalMiles;
    const intervalDays =
      (data.intervalDays as number | null | undefined) ?? existing.intervalDays;
    if (
      (data.intervalMiles !== undefined || data.intervalDays !== undefined) &&
      !existing.nextDueAt &&
      existing.nextDueMiles == null
    ) {
      const mileage = existing.truck?.mileage ?? 0;
      const rolled = computeNextDue({
        completedAt: existing.lastCompletedAt ?? new Date(),
        mileage,
        intervalMiles,
        intervalDays,
      });
      data.nextDueAt = rolled.nextDueAt;
      data.nextDueMiles = rolled.nextDueMiles;
    }

    const program = await prisma.serviceProgram.update({
      where: { id },
      data,
      include: { truck: { select: { id: true, unitNumber: true, mileage: true } } },
    });

    return NextResponse.json({ program });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const existing = await prisma.serviceProgram.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 });
    }
    await prisma.serviceProgram.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
