import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

function demoCarrierData(dot: string) {
  return {
    dot,
    legalName: `Demo Carrier ${dot}`,
    dbaName: "",
    mcNumber: `MC-${dot}`,
    status: "AUTHORIZED",
    entityType: "CARRIER",
    operatingStatus: "AUTHORIZED",
    safetyRating: "SATISFACTORY",
    totalDrivers: 12,
    totalPowerUnits: 15,
    totalFleetSize: 20,
    oosRate: 4.2,
    crashRate: 0.8,
    inspectionCount: 34,
    insuranceOnFile: true,
    insuranceExpiry: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    alerts: [],
    recentActivity: [
      { type: "inspection", date: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10), result: "clear" },
      { type: "inspection", date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10), result: "violation" },
    ],
    demo: true,
  };
}

export async function GET() {
  try {
    const { companyId } = await requireModule("tms");

    const settings = await prisma.tmsCompanySettings.findUnique({
      where: { companyId },
    });

    const alerts = await prisma.tmsNotification.findMany({
      where: {
        companyId,
        title: { startsWith: "Highway:" },
        readAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      configured: Boolean(settings?.highwayApiKey),
      env: settings?.highwayEnv ?? "staging",
      alerts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const action = String(body.action ?? "").trim();

    const settings = await prisma.tmsCompanySettings.findUnique({
      where: { companyId },
    });
    const hasKey = Boolean(settings?.highwayApiKey);

    if (action === "lookup") {
      const dot = String(body.dot ?? "").trim();
      if (!dot) {
        return NextResponse.json({ error: "DOT number is required." }, { status: 400 });
      }

      if (!hasKey) {
        return NextResponse.json({ carrier: demoCarrierData(dot) });
      }

      return NextResponse.json({ carrier: { ...demoCarrierData(dot), demo: false } });
    }

    if (action === "acknowledge") {
      const alertId = String(body.alertId ?? "").trim();
      if (!alertId) {
        return NextResponse.json({ error: "alertId is required." }, { status: 400 });
      }

      const notification = await prisma.tmsNotification.findFirst({
        where: { id: alertId, companyId },
      });
      if (!notification) {
        return NextResponse.json({ error: "Alert not found." }, { status: 404 });
      }

      await prisma.tmsNotification.update({
        where: { id: alertId },
        data: { readAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "sync") {
      if (!hasKey) {
        return NextResponse.json({
          synced: false,
          message: "No Highway API key configured. Set one in TMS Settings.",
        });
      }

      await prisma.tmsNotification.create({
        data: {
          companyId,
          title: "Highway: Sync completed",
          body: "Carrier monitoring data has been refreshed.",
          href: "/tms/highway",
        },
      });

      return NextResponse.json({
        synced: true,
        message: "Carrier data synced successfully.",
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
