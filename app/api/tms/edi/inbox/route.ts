import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";

    const items = await prisma.tmsEdiInboxItem.findMany({
      where: { companyId, status },
      orderBy: { createdAt: "desc" },
      include: {
        partner: { select: { id: true, name: true, scac: true } },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const action = String(body.action ?? "").trim();
    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "action must be 'accept' or 'decline'." },
        { status: 400 }
      );
    }

    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Inbox item id is required." }, { status: 400 });
    }

    const item = await prisma.tmsEdiInboxItem.findFirst({
      where: { id, companyId, status: "pending" },
    });
    if (!item) {
      return NextResponse.json(
        { error: "Inbox item not found or already processed." },
        { status: 404 }
      );
    }

    if (action === "decline") {
      const updated = await prisma.tmsEdiInboxItem.update({
        where: { id },
        data: {
          status: "declined",
          declineReason: String(body.declineReason ?? "").trim(),
        },
      });
      return NextResponse.json({ item: updated });
    }

    const count = await prisma.tmsLoad.count({ where: { companyId } });
    const loadNumber = `LD-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const load = await prisma.tmsLoad.create({
      data: {
        companyId,
        loadNumber,
        status: "pending",
        origin: item.origin,
        destination: item.destination,
        pickupDate: item.pickupDate,
        equipmentType: item.equipment,
        totalRevenue: item.rate ?? 0,
        linehaulRevenue: item.rate ?? 0,
      },
    });

    const updated = await prisma.tmsEdiInboxItem.update({
      where: { id },
      data: { status: "accepted", loadId: load.id },
    });

    return NextResponse.json({ item: updated, load }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
