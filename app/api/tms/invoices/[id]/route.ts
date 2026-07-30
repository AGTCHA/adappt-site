import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { agingBucketFor, INVOICE_STATUSES } from "@/src/lib/tms/constants";
import { shapeInvoice } from "@/src/lib/tms/invoice-shape";
import { parseDate } from "@/src/lib/tms/parse";

type Ctx = { params: Promise<{ id: string }> };

const invoiceInclude = {
  lineItems: { orderBy: { sortOrder: "asc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
  load: {
    select: {
      id: true,
      loadNumber: true,
      origin: true,
      destination: true,
      status: true,
      totalRevenue: true,
    },
  },
  customer: {
    select: { id: true, name: true, contactEmail: true, paymentTerms: true },
  },
};

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;

    const invoice = await prisma.tmsInvoice.findFirst({
      where: { id, companyId },
      include: invoiceInclude,
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json({ invoice: shapeInvoice(invoice) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { companyId, userId, name: userName } = await requireModule("tms");
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.tmsInvoice.findFirst({
      where: { id, companyId },
      include: { payments: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (body.action === "send") {
      const email = String(body.email ?? existing.billToEmail).trim();
      if (!email) {
        return NextResponse.json({ error: "No email address available." }, { status: 400 });
      }

      const invoice = await prisma.tmsInvoice.update({
        where: { id },
        data: {
          sentAt: new Date(),
          sentToEmail: email,
        },
        include: invoiceInclude,
      });
      return NextResponse.json({ invoice: shapeInvoice(invoice) });
    }

    if (body.action === "mark_sent") {
      const invoice = await prisma.tmsInvoice.update({
        where: { id },
        data: { sentAt: new Date() },
        include: invoiceInclude,
      });
      return NextResponse.json({ invoice: shapeInvoice(invoice) });
    }

    if (body.action === "record_payment") {
      const amount = Number(body.amount);
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "A positive payment amount is required." }, { status: 400 });
      }

      if (existing.status === "voided") {
        return NextResponse.json({ error: "Cannot record payment on a voided invoice." }, { status: 400 });
      }

      const invoice = await prisma.$transaction(async (tx) => {
        await tx.tmsInvoicePayment.create({
          data: {
            invoiceId: id,
            amount,
            paymentDate: parseDate(body.paymentDate) ?? new Date(),
            method: String(body.method ?? "ach").trim(),
            reference: String(body.reference ?? "").trim(),
            notes: String(body.notes ?? "").trim(),
            recordedBy: userName || userId,
          },
        });

        const allPayments = await tx.tmsInvoicePayment.findMany({
          where: { invoiceId: id },
        });
        const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);
        const balance = Math.max(0, existing.total - totalPaid);

        let status: string;
        if (balance <= 0) {
          status = "paid";
        } else if (totalPaid > 0) {
          status = "partial";
        } else {
          status = existing.status;
        }

        const inv = await tx.tmsInvoice.update({
          where: { id },
          data: {
            amountPaid: totalPaid,
            balance,
            status,
            agingBucket: status === "paid" ? "current" : agingBucketFor(existing.dueDate),
          },
          include: invoiceInclude,
        });

        if (inv.loadId) {
          await tx.tmsLoad.update({
            where: { id: inv.loadId },
            data: { invoiceStatus: status },
          });
        }

        return inv;
      });

      return NextResponse.json({ invoice: shapeInvoice(invoice) });
    }

    if (body.action === "void") {
      if (existing.status === "voided") {
        return NextResponse.json({ error: "Invoice is already voided." }, { status: 400 });
      }

      const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.tmsInvoice.update({
          where: { id },
          data: {
            status: "voided",
            voidedAt: new Date(),
            voidReason: String(body.reason ?? "").trim(),
            balance: 0,
            agingBucket: "current",
          },
          include: invoiceInclude,
        });

        if (inv.loadId) {
          const otherActive = await tx.tmsInvoice.count({
            where: { loadId: inv.loadId, id: { not: id }, status: { not: "voided" } },
          });
          if (otherActive === 0) {
            await tx.tmsLoad.update({
              where: { id: inv.loadId },
              data: { invoiceStatus: "pending" },
            });
          }
        }

        return inv;
      });

      return NextResponse.json({ invoice: shapeInvoice(invoice) });
    }

    const data: Record<string, unknown> = {};
    if (body.notes != null) data.notes = String(body.notes).trim();
    if (body.dueDate !== undefined) {
      data.dueDate = parseDate(body.dueDate);
      if (data.dueDate && existing.status !== "voided" && existing.status !== "paid") {
        data.agingBucket = agingBucketFor(data.dueDate as Date);
      }
    }
    if (body.billToName != null) data.billToName = String(body.billToName).trim();
    if (body.billToAddress != null) data.billToAddress = String(body.billToAddress).trim();
    if (body.billToCity != null) data.billToCity = String(body.billToCity).trim();
    if (body.billToState != null) data.billToState = String(body.billToState).trim();
    if (body.billToZip != null) data.billToZip = String(body.billToZip).trim();
    if (body.billToEmail != null) data.billToEmail = String(body.billToEmail).trim();
    if (body.status && (INVOICE_STATUSES as readonly string[]).includes(body.status)) {
      data.status = body.status;
    }

    const invoice = await prisma.tmsInvoice.update({
      where: { id },
      data,
      include: invoiceInclude,
    });

    return NextResponse.json({ invoice: shapeInvoice(invoice) });
  } catch (error) {
    return handleApiError(error);
  }
}
