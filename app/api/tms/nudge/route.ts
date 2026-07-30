import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

/**
 * HOS risk board (Forge Nudge parity without live ELD clocks).
 * Ranks in-transit / assigned loads by delivery urgency and suggests nudges.
 */
export async function GET() {
  try {
    const { companyId } = await requireModule("tms");
    const now = new Date();

    const loads = await prisma.tmsLoad.findMany({
      where: {
        companyId,
        status: { in: ["assigned", "in_transit"] },
      },
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        truck: { select: { id: true, unitNumber: true } },
      },
      orderBy: { deliveryDate: "asc" },
      take: 200,
    });

    const rows = loads.map((load) => {
      const delivery = load.deliveryDate?.getTime() ?? null;
      const hoursLeft =
        delivery != null ? (delivery - now.getTime()) / (1000 * 60 * 60) : null;
      let urgency: "critical" | "urgent" | "recommended" | "ok" = "ok";
      if (hoursLeft != null) {
        if (hoursLeft < 4) urgency = "critical";
        else if (hoursLeft < 12) urgency = "urgent";
        else if (hoursLeft < 24) urgency = "recommended";
      }
      if (!load.driverId) urgency = "critical";

      const suggestion =
        urgency === "critical"
          ? "Call driver now — delivery window at risk"
          : urgency === "urgent"
            ? "Send status check via mailbox"
            : urgency === "recommended"
              ? "Confirm ETA and appointment"
              : "On track — monitor only";

      return {
        loadId: load.id,
        loadNumber: load.loadNumber,
        origin: load.origin,
        destination: load.destination,
        status: load.status,
        urgency,
        hoursToDelivery: hoursLeft != null ? Math.round(hoursLeft * 10) / 10 : null,
        suggestion,
        driver: load.driver,
        truck: load.truck,
      };
    });

    const summary = {
      total: rows.length,
      critical: rows.filter((r) => r.urgency === "critical").length,
      urgent: rows.filter((r) => r.urgency === "urgent").length,
      recommended: rows.filter((r) => r.urgency === "recommended").length,
    };

    return NextResponse.json({ summary, rows });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, name } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));
    const loadId = String(body.loadId ?? "");
    const driverId = body.driverId ? String(body.driverId) : null;
    const text =
      String(body.body ?? "").trim() ||
      "Dispatch check-in: please confirm your ETA and current status.";

    if (!loadId) {
      return NextResponse.json({ error: "loadId is required." }, { status: 400 });
    }

    const load = await prisma.tmsLoad.findFirst({
      where: { id: loadId, companyId },
    });
    if (!load) {
      return NextResponse.json({ error: "Load not found." }, { status: 404 });
    }

    const targetDriver = driverId ?? load.driverId;
    if (!targetDriver) {
      return NextResponse.json(
        { error: "No driver assigned to nudge." },
        { status: 400 },
      );
    }

    const message = await prisma.tmsMessage.create({
      data: {
        companyId,
        loadId,
        driverId: targetDriver,
        direction: "outbound",
        body: `[Nudge from ${name}] ${text}`,
      },
    });

    await prisma.tmsNotification.create({
      data: {
        companyId,
        title: `Nudge sent — ${load.loadNumber}`,
        body: text,
        href: `/tms/loads/${load.id}`,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
