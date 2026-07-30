import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    const messages = await prisma.message.findMany({
      where: { companyId, ...(channel && channel !== "all" ? { channel } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("recruiting");
    const body = await request.json().catch(() => ({}));

    const text = String(body.body ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        companyId,
        driverId: typeof body.driverId === "string" ? body.driverId : null,
        direction: body.direction === "inbound" ? "inbound" : "outbound",
        channel: ["sms", "call", "ai_call", "email", "system"].includes(body.channel)
          ? body.channel
          : "sms",
        contactName: String(body.contactName ?? "").trim(),
        body: text,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
