import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { agingBucketFor, INVOICE_STATUSES } from "@/src/lib/tms/constants";
import { nextNumber } from "@/src/lib/tms/parse";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const aging = searchParams.get("aging");
    const q = searchParams.get("q")?.trim();
    const customerId = searchParams.get("customerId");
    const loadId = searchParams.get("loadId");

    const where: Record<string, unknown> = { companyId };
    if (status && (INVOICE_STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }
    if (aging) where.agingBucket = aging;
    if (customerId) where.customerId = customerId;
    if (loadId) where.loadId = loadId;

    if (q) {
      where.OR = [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { billToName: { contains: q, mode: "insensitive" } },
        { load: { loadNumber: { contains: q, mode: "insensitive" } } },
      ];
    }

    const invoices = await prisma.tmsInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            origin: true,
            destination: true,
            status: true,
          },
        },
        customer: {
          select: { id: true, name: true, contactEmail: true },
        },
        lineItems: { orderBy: { sortOrder: "asc" } },
        _count: { select: { payments: true } },
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const loadId = String(body.loadId ?? "").trim();
    if (!loadId) {
      return NextResponse.json({ error: "loadId is required." }, { status: 400 });
    }

    const load = await prisma.tmsLoad.findFirst({
      where: { id: loadId, companyId },
      include: {
        customer: true,
        documents: { select: { type: true } },
      },
    });
    if (!load) {
      return NextResponse.json({ error: "Load not found." }, { status: 404 });
    }

    if (load.status !== "delivered" && !body.force) {
      return NextResponse.json(
        { error: "Load must be delivered before invoicing. Pass force=true to override." },
        { status: 400 },
      );
    }

    const hasPod = load.documents.some((d) => d.type === "pod");
    if (!hasPod && !body.force) {
      return NextResponse.json(
        { error: "No POD document found on this load. Pass force=true to override." },
        { status: 400 },
      );
    }

    const existingInvoice = await prisma.tmsInvoice.findFirst({
      where: { loadId, companyId, status: { not: "voided" } },
    });
    if (existingInvoice && !body.force) {
      return NextResponse.json(
        { error: `Load already has active invoice ${existingInvoice.invoiceNumber}. Pass force=true to create another.` },
        { status: 409 },
      );
    }

    const invoiceCount = await prisma.tmsInvoice.count({ where: { companyId } });
    const invoiceNumber = nextNumber("INV", invoiceCount + 1);

    const paymentTermsDays = Number(body.paymentTerms) || load.customer?.paymentTerms || 30;
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);

    const lineItems: { chargeCode: string; description: string; quantity: number; rate: number; amount: number; sortOrder: number }[] = [];
    let sortOrder = 0;

    if (load.linehaulRevenue > 0) {
      lineItems.push({
        chargeCode: "FRT",
        description: "Linehaul freight",
        quantity: 1,
        rate: load.linehaulRevenue,
        amount: load.linehaulRevenue,
        sortOrder: sortOrder++,
      });
    }

    if (load.fuelSurcharge > 0) {
      lineItems.push({
        chargeCode: "FSC",
        description: "Fuel surcharge",
        quantity: 1,
        rate: load.fuelSurcharge,
        amount: load.fuelSurcharge,
        sortOrder: sortOrder++,
      });
    }

    if (load.accessorialCharges > 0) {
      lineItems.push({
        chargeCode: "ACC",
        description: "Accessorial charges",
        quantity: 1,
        rate: load.accessorialCharges,
        amount: load.accessorialCharges,
        sortOrder: sortOrder++,
      });
    }

    const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.tmsInvoice.create({
        data: {
          companyId,
          loadId,
          customerId: load.customerId,
          invoiceNumber,
          status: "invoiced",
          invoiceDate,
          dueDate,
          subtotal,
          total: subtotal,
          amountPaid: 0,
          balance: subtotal,
          agingBucket: agingBucketFor(dueDate),
          billToName: load.customer?.name ?? load.customerName ?? "",
          billToAddress: load.customer?.address ?? "",
          billToCity: load.customer?.city ?? "",
          billToState: load.customer?.state ?? "",
          billToZip: load.customer?.zip ?? "",
          billToEmail: load.customer?.contactEmail ?? "",
          notes: String(body.notes ?? "").trim(),
          lineItems: { create: lineItems },
        },
        include: {
          lineItems: { orderBy: { sortOrder: "asc" } },
          load: {
            select: { id: true, loadNumber: true, origin: true, destination: true },
          },
          customer: { select: { id: true, name: true } },
        },
      });

      await tx.tmsLoad.update({
        where: { id: loadId },
        data: { invoiceStatus: "invoiced" },
      });

      return inv;
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
