import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const body = await request.json().catch(() => ({}));
    const truckId = String(body.truckId ?? "");
    const reading = Number(body.reading);

    if (!truckId || !Number.isFinite(reading) || reading < 0) {
      return NextResponse.json(
        { error: "truckId and a valid reading are required." },
        { status: 400 }
      );
    }

    const truck = await prisma.truck.findFirst({ where: { id: truckId, companyId } });
    if (!truck) {
      return NextResponse.json({ error: "Truck not found." }, { status: 404 });
    }

    const [snapshot] = await prisma.$transaction([
      prisma.odometerSnapshot.create({
        data: {
          companyId,
          truckId,
          reading: Math.round(reading),
          source: "manual",
        },
      }),
      prisma.truck.update({
        where: { id: truckId },
        data: { mileage: Math.round(reading) },
      }),
    ]);

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
