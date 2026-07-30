import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;

    const truck = await prisma.truck.findFirst({
      where: { id, companyId },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        workOrders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { vendor: { select: { name: true } } },
        },
        maintenance: { orderBy: { date: "desc" }, take: 30 },
        servicePrograms: true,
        odometerSnapshots: { orderBy: { recordedAt: "desc" }, take: 10 },
      },
    });
    if (!truck) {
      return NextResponse.json({ error: "Truck not found." }, { status: 404 });
    }
    return NextResponse.json({ truck });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.truck.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Truck not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    for (const field of ["unitNumber", "make", "model", "vin"] as const) {
      if (typeof body[field] === "string") data[field] = body[field].trim();
    }
    if (body.year != null) data.year = Number(body.year) || existing.year;
    if (body.mileage != null) data.mileage = Number(body.mileage) || 0;
    if (["active", "in_shop", "inactive"].includes(body.status)) {
      data.status = body.status;
    }

    if ("driverId" in body) {
      if (body.driverId === null) {
        data.driver = { disconnect: true };
      } else {
        const driver = await prisma.driver.findFirst({
          where: { id: String(body.driverId), companyId },
          include: { truck: { select: { id: true } } },
        });
        if (!driver) {
          return NextResponse.json({ error: "Driver not found." }, { status: 404 });
        }
        if (driver.truck && driver.truck.id !== id) {
          await prisma.truck.update({
            where: { id: driver.truck.id },
            data: { driver: { disconnect: true } },
          });
        }
        data.driver = { connect: { id: driver.id } };
      }
    }

    const truck = await prisma.truck.update({
      where: { id },
      data,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return NextResponse.json({ truck });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;

    const existing = await prisma.truck.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Truck not found." }, { status: 404 });
    }

    await prisma.truck.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
