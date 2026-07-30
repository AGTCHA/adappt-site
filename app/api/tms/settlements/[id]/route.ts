import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { parseDate } from "@/src/lib/tms/parse";

type Ctx = { params: Promise<{ id: string }> };

const settlementInclude = {
  driver: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  },
  lines: {
    orderBy: { createdAt: "asc" as const },
    include: {
      load: {
        select: {
          id: true,
          loadNumber: true,
          origin: true,
          destination: true,
          deliveryDate: true,
          totalRevenue: true,
        },
      },
    },
  },
  adjustments: { orderBy: { createdAt: "desc" as const } },
};

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;

    const settlement = await prisma.tmsSettlement.findFirst({
      where: { id, companyId },
      include: settlementInclude,
    });
    if (!settlement) {
      return NextResponse.json({ error: "Settlement not found." }, { status: 404 });
    }

    return NextResponse.json({ settlement });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { companyId, userId, name: userName } = await requireModule("tms");
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.tmsSettlement.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Settlement not found." }, { status: 404 });
    }

    if (body.action === "approve") {
      if (existing.status !== "draft") {
        return NextResponse.json(
          { error: `Cannot approve a settlement with status "${existing.status}".` },
          { status: 400 },
        );
      }

      const settlement = await prisma.tmsSettlement.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: userName || userId,
        },
        include: settlementInclude,
      });
      return NextResponse.json({ settlement });
    }

    if (body.action === "pay") {
      if (existing.status === "paid") {
        return NextResponse.json({ error: "Settlement is already paid." }, { status: 400 });
      }
      if (existing.status === "draft") {
        return NextResponse.json(
          { error: "Settlement must be approved before paying." },
          { status: 400 },
        );
      }

      const settlement = await prisma.tmsSettlement.update({
        where: { id },
        data: {
          status: "paid",
          paidVia: String(body.paidVia ?? "").trim(),
          paidReference: String(body.paidReference ?? "").trim(),
          paidAt: parseDate(body.paidAt) ?? new Date(),
        },
        include: settlementInclude,
      });
      return NextResponse.json({ settlement });
    }

    const data: Record<string, unknown> = {};
    if (body.notes != null) data.notes = String(body.notes).trim();

    const settlement = await prisma.tmsSettlement.update({
      where: { id },
      data,
      include: settlementInclude,
    });
    return NextResponse.json({ settlement });
  } catch (error) {
    return handleApiError(error);
  }
}
