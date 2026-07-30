import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = { companyId };
    if (unreadOnly) where.readAt = null;

    const notifications = await prisma.tmsNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const unreadCount = await prisma.tmsNotification.count({
      where: { companyId, readAt: null },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Notification title is required." }, { status: 400 });
    }

    const notification = await prisma.tmsNotification.create({
      data: {
        companyId,
        title,
        body: String(body.body ?? "").trim(),
        href: String(body.href ?? "").trim(),
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));
    const now = new Date();

    if (body.all === true) {
      await prisma.tmsNotification.updateMany({
        where: { companyId, readAt: null },
        data: { readAt: now },
      });
      return NextResponse.json({ success: true, markedAll: true });
    }

    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
    }

    const existing = await prisma.tmsNotification.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const notification = await prisma.tmsNotification.update({
      where: { id },
      data: { readAt: now },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
    }

    const existing = await prisma.tmsNotification.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    await prisma.tmsNotification.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
