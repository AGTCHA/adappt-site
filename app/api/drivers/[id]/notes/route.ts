import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule, requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { id } = await params;

    const driver = await prisma.driver.findFirst({ where: { id, companyId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const notes = await prisma.driverNote.findMany({
      where: { driverId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ notes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { companyId } = await requireModule("recruiting");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const noteBody = String(body.body ?? "").trim();
    if (!noteBody) {
      return NextResponse.json({ error: "Note body is required." }, { status: 400 });
    }

    const driver = await prisma.driver.findFirst({ where: { id, companyId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const note = await prisma.driverNote.create({
      data: {
        driverId: id,
        body: noteBody,
        kind: "note",
        userId: session.userId,
        userName: session.name,
      },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
