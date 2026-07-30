import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const loadId = searchParams.get("loadId");

    if (driverId) {
      const where: Record<string, unknown> = { companyId, driverId };
      if (loadId) where.loadId = loadId;

      const messages = await prisma.tmsMessage.findMany({
        where,
        orderBy: { createdAt: "asc" },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true } },
          load: { select: { id: true, loadNumber: true } },
        },
      });

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
          driver,
          latestMessage: latest,
          unreadCount,
        };
      })
    );

    const sorted = conversations
      .filter((c) => c.latestMessage)
      .sort(
        (a, b) =>
          (b.latestMessage?.createdAt.getTime() ?? 0) -
          (a.latestMessage?.createdAt.getTime() ?? 0)
      );

    const withoutMessages = conversations.filter((c) => !c.latestMessage);

    return NextResponse.json({ conversations: [...sorted, ...withoutMessages] });
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
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        load: { select: { id: true, loadNumber: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
