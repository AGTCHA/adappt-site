import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.hireSource.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Hire source not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.active === "boolean") data.active = body.active;

    const source = await prisma.hireSource.update({ where: { id }, data });
    return NextResponse.json({ source });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { id } = await params;
    const existing = await prisma.hireSource.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Hire source not found." }, { status: 404 });
    }
    await prisma.hireSource.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
