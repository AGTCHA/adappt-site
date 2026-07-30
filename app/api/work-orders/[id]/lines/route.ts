import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

async function recomputeTotal(workOrderId: string) {
  const lines = await prisma.workOrderLine.findMany({ where: { workOrderId } });
  const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);
  return prisma.workOrder.update({
    where: { id: workOrderId },
    data: { totalAmount },
    include: {
      truck: { select: { id: true, unitNumber: true } },
      vendor: { select: { id: true, name: true } },
      lines: true,
    },
  });
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const wo = await prisma.workOrder.findFirst({ where: { id, companyId } });
    if (!wo) {
      return NextResponse.json({ error: "Work order not found." }, { status: 404 });
    }

    await prisma.workOrderLine.create({
      data: {
        workOrderId: id,
        description: String(body.description ?? "").trim() || "Line item",
        amount: Number(body.amount) || 0,
        partNumber: String(body.partNumber ?? "").trim(),
        laborHours:
          body.laborHours != null && body.laborHours !== ""
            ? Number(body.laborHours) || null
            : null,
        vmrsCode: String(body.vmrsCode ?? "").trim(),
        isPm: Boolean(body.isPm),
        isDot: Boolean(body.isDot),
      },
    });

    const workOrder = await recomputeTotal(id);
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const lineId = String(body.lineId ?? "");

    const wo = await prisma.workOrder.findFirst({ where: { id, companyId } });
    if (!wo) {
      return NextResponse.json({ error: "Work order not found." }, { status: 404 });
    }

    const line = await prisma.workOrderLine.findFirst({
      where: { id: lineId, workOrderId: id },
    });
    if (!line) {
      return NextResponse.json({ error: "Line not found." }, { status: 404 });
    }

    await prisma.workOrderLine.update({
      where: { id: lineId },
      data: {
        ...(typeof body.description === "string"
          ? { description: body.description.trim() || "Line item" }
          : {}),
        ...(body.amount != null ? { amount: Number(body.amount) || 0 } : {}),
        ...(typeof body.partNumber === "string" ? { partNumber: body.partNumber.trim() } : {}),
        ...(body.laborHours !== undefined
          ? {
              laborHours:
                body.laborHours === null || body.laborHours === ""
                  ? null
                  : Number(body.laborHours) || null,
            }
          : {}),
        ...(typeof body.vmrsCode === "string" ? { vmrsCode: body.vmrsCode.trim() } : {}),
        ...(body.isPm !== undefined ? { isPm: Boolean(body.isPm) } : {}),
        ...(body.isDot !== undefined ? { isDot: Boolean(body.isDot) } : {}),
      },
    });

    const workOrder = await recomputeTotal(id);
    return NextResponse.json({ workOrder });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get("lineId") ?? "";

    const wo = await prisma.workOrder.findFirst({ where: { id, companyId } });
    if (!wo) {
      return NextResponse.json({ error: "Work order not found." }, { status: 404 });
    }

    const line = await prisma.workOrderLine.findFirst({
      where: { id: lineId, workOrderId: id },
    });
    if (!line) {
      return NextResponse.json({ error: "Line not found." }, { status: 404 });
    }

    await prisma.workOrderLine.delete({ where: { id: lineId } });
    const workOrder = await recomputeTotal(id);
    return NextResponse.json({ workOrder });
  } catch (error) {
    return handleApiError(error);
  }
}
