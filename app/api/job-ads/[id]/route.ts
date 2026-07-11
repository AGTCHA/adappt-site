import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.jobAd.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Job ad not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    for (const field of ["title", "description", "payRange", "location"] as const) {
      if (typeof body[field] === "string") data[field] = body[field].trim();
    }
    if (["active", "paused", "closed"].includes(body.status)) {
      data.status = body.status;
    }

    const jobAd = await prisma.jobAd.update({
      where: { id },
      data,
      include: { _count: { select: { leads: true } } },
    });
    return NextResponse.json({ jobAd });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await prisma.jobAd.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Job ad not found." }, { status: 404 });
    }

    await prisma.jobAd.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
