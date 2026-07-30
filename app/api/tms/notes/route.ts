import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { parseDate } from "@/src/lib/tms/parse";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = { companyId };
    if (priority) where.priority = priority;

    const notes = await prisma.tmsDispatcherNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ notes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, name } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const noteBody = String(body.body ?? "").trim();
    if (!noteBody) {
      return NextResponse.json({ error: "Note body is required." }, { status: 400 });
    }

    const priority = ["low", "normal", "high", "urgent"].includes(String(body.priority))
      ? String(body.priority)
      : "normal";

    const note = await prisma.tmsDispatcherNote.create({
      data: {
        companyId,
        title: String(body.title ?? "").trim(),
        body: noteBody,
        priority,
        dueAt: parseDate(body.dueAt),
        createdBy: name,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Note id is required." }, { status: 400 });
    }

    const existing = await prisma.tmsDispatcherNote.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.body !== undefined) data.body = String(body.body).trim();
    if (body.priority !== undefined) {
      data.priority = ["low", "normal", "high", "urgent"].includes(String(body.priority))
        ? String(body.priority)
        : existing.priority;
    }
    if (body.dueAt !== undefined) data.dueAt = parseDate(body.dueAt);

    const note = await prisma.tmsDispatcherNote.update({
      where: { id },
      data,
    });

    return NextResponse.json({ note });
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
      return NextResponse.json({ error: "Note id is required." }, { status: 400 });
    }

    const existing = await prisma.tmsDispatcherNote.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    await prisma.tmsDispatcherNote.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
