import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { completeWorkOrder } from "@/src/lib/maintenance";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.workOrder.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Work order not found." }, { status: 404 });
    }
    if (existing.status === "completed") {
      return NextResponse.json({ error: "Work order already completed." }, { status: 400 });
    }

    const workOrder = await completeWorkOrder(companyId, id, {
      odometer: body.odometer != null ? Number(body.odometer) : null,
      createRecord: body.createRecord !== false,
    });

    return NextResponse.json({ workOrder });
  } catch (error) {
    return handleApiError(error);
  }
}
