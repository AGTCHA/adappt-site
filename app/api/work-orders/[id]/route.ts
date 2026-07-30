import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        truck: { select: { id: true, unitNumber: true, make: true, model: true } },
        vendor: { select: { id: true, name: true, phone: true, email: true } },
        lines: true,
        maintenance: {
          orderBy: { date: "desc" },
          select: { id: true, date: true, amount: true, description: true },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found." }, { status: 404 });
    }

    return NextResponse.json({ workOrder });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.workOrder.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Work order not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    for (const field of ["title", "description", "notes", "invoiceRef"] as const) {
      if (typeof body[field] === "string") data[field] = body[field].trim();
    }
    if (["open", "in_progress", "cancelled"].includes(body.status)) {
      data.status = body.status;
    }
    if (body.status === "completed") {
      return NextResponse.json(
        { error: "Use POST /api/work-orders/:id/complete to complete a work order." },
        { status: 400 }
      );
    }
    if (body.totalAmount != null) data.totalAmount = Number(body.totalAmount) || 0;
    if (body.odometer != null) data.odometer = Number(body.odometer) || null;
    if (["preventative", "accident"].includes(body.category)) {
      data.category = body.category;
    }
    if ("vendorId" in body) {
      if (body.vendorId === null) {
        data.vendorId = null;
      } else {
        const vendor = await prisma.vendor.findFirst({
          where: { id: String(body.vendorId), companyId },
        });
        if (!vendor) {
          return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
        }
        data.vendorId = vendor.id;
      }
    }

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data,
      include: {
        truck: { select: { id: true, unitNumber: true } },
        vendor: { select: { id: true, name: true } },
        lines: true,
      },
    });

    return NextResponse.json({ workOrder });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;

    const existing = await prisma.workOrder.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Work order not found." }, { status: 404 });
    }

    await prisma.workOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
