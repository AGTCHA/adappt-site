import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { agingBucketFor, AGING_BUCKETS } from "@/src/lib/tms/constants";

export async function GET() {
  try {
    const { companyId } = await requireModule("tms");

    const openInvoices = await prisma.tmsInvoice.findMany({
      where: {
        companyId,
        status: { in: ["invoiced", "partial"] },
      },
    });

    const now = new Date();
    const updates: { id: string; bucket: string }[] = [];

    for (const inv of openInvoices) {
      const newBucket = agingBucketFor(inv.dueDate, now);
      if (newBucket !== inv.agingBucket) {
        updates.push({ id: inv.id, bucket: newBucket });
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.tmsInvoice.update({
            where: { id: u.id },
            data: { agingBucket: u.bucket },
          }),
        ),
      );
    }

    const refreshed = await prisma.tmsInvoice.findMany({
      where: {
        companyId,
        status: { in: ["invoiced", "partial"] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        balance: true,
        dueDate: true,
        agingBucket: true,
        billToName: true,
      },
    });

    const summary: Record<string, { count: number; total: number }> = {};
    for (const bucket of AGING_BUCKETS) {
      summary[bucket] = { count: 0, total: 0 };
    }
    for (const inv of refreshed) {
      const b = inv.agingBucket as string;
      if (!summary[b]) summary[b] = { count: 0, total: 0 };
      summary[b].count += 1;
      summary[b].total += inv.balance;
    }

    return NextResponse.json({
      summary,
      totalOutstanding: refreshed.reduce((s, inv) => s + inv.balance, 0),
      invoiceCount: refreshed.length,
      updated: updates.length,
      invoices: refreshed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
