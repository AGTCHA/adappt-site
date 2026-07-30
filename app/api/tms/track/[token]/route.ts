import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { token } = await context.params;

    if (!token || token.length < 8) {
      return NextResponse.json({ error: "Invalid tracking token." }, { status: 400 });
    }

    const load = await prisma.tmsLoad.findFirst({
      where: { trackingToken: token },
      include: {
        driver: { select: { firstName: true } },
        stops: {
          orderBy: { sequence: "asc" },
          select: {
            type: true,
            city: true,
            state: true,
            scheduledAt: true,
            arrivedAt: true,
            departedAt: true,
          },
        },
      },
    });

    if (!load) {
      return NextResponse.json({ error: "Load not found." }, { status: 404 });
    }

    if (load.trackingTokenExpiresAt && load.trackingTokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "Tracking link has expired." }, { status: 410 });
    }

    return NextResponse.json({
      loadNumber: load.loadNumber,
      status: load.status,
      origin: load.origin,
      destination: load.destination,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      driverFirstName: load.driver?.firstName ?? null,
      stops: load.stops,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
