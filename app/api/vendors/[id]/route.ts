import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
      include: {
        workOrders: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { truck: { select: { unitNumber: true } } },
        },
      },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    const spend = vendor.workOrders
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + w.totalAmount, 0);

    return NextResponse.json({ vendor, spend });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.vendor.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    const data: Record<string, string> = {};
    for (const field of ["name", "phone", "email", "address", "city", "state", "notes"] as const) {
      if (typeof body[field] === "string") data[field] = body[field].trim();
    }
    if (data.name === "") {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const vendor = await prisma.vendor.update({ where: { id }, data });
    return NextResponse.json({ vendor });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;

    const existing = await prisma.vendor.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    await prisma.vendor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
