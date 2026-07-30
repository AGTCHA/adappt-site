import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { nextWoNumber } from "@/src/lib/maintenance";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const truckId = searchParams.get("truckId");

    const workOrders = await prisma.workOrder.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
        ...(truckId ? { truckId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        truck: { select: { id: true, unitNumber: true } },
        vendor: { select: { id: true, name: true } },
        lines: true,
      },
    });

    return NextResponse.json({ workOrders });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const body = await request.json().catch(() => ({}));

    const truckId = String(body.truckId ?? "");
    const title = String(body.title ?? "").trim();
    if (!truckId || !title) {
      return NextResponse.json({ error: "Truck and title are required." }, { status: 400 });
    }

    const truck = await prisma.truck.findFirst({ where: { id: truckId, companyId } });
    if (!truck) {
      return NextResponse.json({ error: "Truck not found." }, { status: 404 });
    }

    if (body.vendorId) {
      const vendor = await prisma.vendor.findFirst({
        where: { id: String(body.vendorId), companyId },
      });
      if (!vendor) {
        return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
      }
    }

    const lines: {
      description: string;
      amount: number;
      isPm?: boolean;
      isDot?: boolean;
      partNumber?: string;
      vmrsCode?: string;
      laborHours?: number;
    }[] = Array.isArray(body.lines) ? body.lines : [];
    const totalAmount = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
    const woNumber = await nextWoNumber(companyId);

    const workOrder = await prisma.workOrder.create({
      data: {
        companyId,
        truckId,
        vendorId: body.vendorId ? String(body.vendorId) : null,
        woNumber,
        title,
        description: String(body.description ?? "").trim(),
        notes: String(body.notes ?? "").trim(),
        invoiceRef: String(body.invoiceRef ?? "").trim(),
        status: ["open", "in_progress", "completed", "cancelled"].includes(body.status)
          ? body.status
          : "open",
        totalAmount: Number.isFinite(Number(body.totalAmount))
          ? Number(body.totalAmount)
          : totalAmount,
        odometer: body.odometer != null ? Number(body.odometer) || null : null,
        category: body.category === "accident" ? "accident" : "preventative",
        lines: {
          create: lines.map((line) => ({
            description: String(line.description ?? "").trim() || "Line item",
            amount: Number(line.amount) || 0,
            partNumber: String(line.partNumber ?? "").trim(),
            vmrsCode: String(line.vmrsCode ?? "").trim(),
            laborHours:
              line.laborHours != null ? Number(line.laborHours) || null : null,
            isPm: Boolean(line.isPm),
            isDot: Boolean(line.isDot),
          })),
        },
      },
      include: {
        truck: { select: { id: true, unitNumber: true } },
        vendor: { select: { id: true, name: true } },
        lines: true,
      },
    });

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
