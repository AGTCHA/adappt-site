import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;

    const customer = await prisma.tmsCustomer.findFirst({
      where: { id, companyId },
      include: {
        loads: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            loadNumber: true,
            status: true,
            origin: true,
            destination: true,
            totalRevenue: true,
            pickupDate: true,
            deliveryDate: true,
            invoiceStatus: true,
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            balance: true,
            dueDate: true,
            agingBucket: true,
          },
        },
        _count: { select: { loads: true, invoices: true } },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const stats = await prisma.tmsInvoice.aggregate({
      where: { customerId: id, companyId },
      _sum: { total: true, amountPaid: true, balance: true },
      _count: true,
    });

    const loadStats = await prisma.tmsLoad.aggregate({
      where: { customerId: id, companyId },
      _sum: { totalRevenue: true },
      _count: true,
    });

    return NextResponse.json({
      customer,
      financialStats: {
        totalInvoiced: stats._sum.total ?? 0,
        totalPaid: stats._sum.amountPaid ?? 0,
        outstandingBalance: stats._sum.balance ?? 0,
        invoiceCount: stats._count,
        loadCount: loadStats._count,
        totalRevenue: loadStats._sum.totalRevenue ?? 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.tmsCustomer.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    const stringFields = [
      "name", "mcNumber", "dotNumber", "address", "city", "state", "zip",
      "contactName", "contactEmail", "contactPhone", "creditRating",
    ] as const;
    for (const field of stringFields) {
      if (body[field] != null) data[field] = String(body[field]).trim();
    }
    if (body.paymentTerms != null) data.paymentTerms = Number(body.paymentTerms) || 30;
    if (body.isActive != null) data.isActive = body.isActive === true;

    const customer = await prisma.tmsCustomer.update({ where: { id }, data });
    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;

    const existing = await prisma.tmsCustomer.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const loadCount = await prisma.tmsLoad.count({ where: { customerId: id } });
    if (loadCount > 0) {
      await prisma.tmsCustomer.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ ok: true, deactivated: true });
    }

    await prisma.tmsCustomer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
