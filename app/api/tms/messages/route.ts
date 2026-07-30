import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

function driverDisplayName(driver: {
  firstName?: string | null;
  lastName?: string | null;
}) {
  return [driver.firstName, driver.lastName].filter(Boolean).join(" ").trim() || "Driver";
}

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const loadId = searchParams.get("loadId");

    if (driverId) {
      const where: Record<string, unknown> = { companyId, driverId };
      if (loadId) where.loadId = loadId;

      const rows = await prisma.tmsMessage.findMany({
        where,
        orderBy: { createdAt: "asc" },
      });

      const messages = rows.map((m) => ({
        id: m.id,
        body: m.body,
        sender: m.direction === "inbound" ? "driver" : "dispatcher",
        direction: m.direction,
        createdAt: m.createdAt,
        loadId: m.loadId,
      }));

      return NextResponse.json({ messages });
    }

    const drivers = await prisma.driver.findMany({
      where: {
        companyId,
        status: { in: ["active", "hired"] },
        archivedAt: null,
      },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });

    const conversations = await Promise.all(
      drivers.map(async (driver) => {
        const [latest, unreadCount] = await Promise.all([
          prisma.tmsMessage.findFirst({
            where: { companyId, driverId: driver.id },
            orderBy: { createdAt: "desc" },
          }),
          prisma.tmsMessage.count({
            where: {
              companyId,
              driverId: driver.id,
              direction: "inbound",
              readAt: null,
            },
          }),
        ]);

        return {
          id: driver.id,
          driverId: driver.id,
          driverName: driverDisplayName(driver),
          lastMessage: latest?.body ?? "",
          lastMessageAt: latest?.createdAt?.toISOString() ?? null,
          unreadCount,
          hasMessages: Boolean(latest),
        };
      }),
    );

    conversations.sort((a, b) => {
      if (a.hasMessages !== b.hasMessages) return a.hasMessages ? -1 : 1;
      return (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "");
    });

    return NextResponse.json({
      conversations: conversations.map(({ hasMessages: _, ...rest }) => rest),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const driverId = String(body.driverId ?? "").trim();
    if (!driverId) {
      return NextResponse.json({ error: "driverId is required." }, { status: 400 });
    }

    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId },
    });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const msgBody = String(body.body ?? "").trim();
    if (!msgBody) {
      return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    }

    const loadId = body.loadId ? String(body.loadId) : null;
    if (loadId) {
      const load = await prisma.tmsLoad.findFirst({
        where: { id: loadId, companyId },
      });
      if (!load) {
        return NextResponse.json({ error: "Load not found." }, { status: 404 });
      }
    }

    const direction = body.direction === "inbound" ? "inbound" : "outbound";

    const message = await prisma.tmsMessage.create({
      data: {
        companyId,
        driverId,
        loadId,
        direction,
        body: msgBody,
        attachmentName: String(body.attachmentName ?? "").trim(),
        attachmentData: String(body.attachmentData ?? ""),
      },
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          body: message.body,
          sender: direction === "inbound" ? "driver" : "dispatcher",
          direction,
          createdAt: message.createdAt,
          loadId: message.loadId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
