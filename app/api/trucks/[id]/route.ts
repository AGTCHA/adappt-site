import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.truck.findFirst({ where: { id, userId } });
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

    // Driver assignment: null unassigns; a driver can only hold one truck
    if ("driverId" in body) {
      if (body.driverId === null) {
        data.driver = { disconnect: true };
      } else {
        const driver = await prisma.driver.findFirst({
          where: { id: String(body.driverId), userId },
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
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await prisma.truck.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Truck not found." }, { status: 404 });
    }

    await prisma.truck.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
