import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const { companyId } = await requireModule("fleet");
    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { workOrders: true } },
        workOrders: {
          where: { status: "completed" },
          select: { totalAmount: true },
        },
      },
    });
    return NextResponse.json({
      vendors: vendors.map(({ workOrders, ...v }) => ({
        ...v,
        spend: workOrders.reduce((sum, w) => sum + w.totalAmount, 0),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const body = await request.json().catch(() => ({}));

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Vendor name is required." }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        companyId,
        name,
        phone: String(body.phone ?? "").trim(),
        email: String(body.email ?? "").trim(),
        address: String(body.address ?? "").trim(),
        city: String(body.city ?? "").trim(),
        state: String(body.state ?? "").trim(),
        notes: String(body.notes ?? "").trim(),
      },
    });

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
