import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { PAY_RULE_TYPES } from "@/src/lib/tms/constants";
import { parseDate, parseNumber } from "@/src/lib/tms/parse";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.tmsDriverPayRule.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Pay rule not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.ruleType != null) {
      if (!(PAY_RULE_TYPES as readonly string[]).includes(String(body.ruleType))) {
        return NextResponse.json(
          { error: `Invalid ruleType. Must be one of: ${PAY_RULE_TYPES.join(", ")}` },
          { status: 400 },
        );
      }
      data.ruleType = String(body.ruleType);
    }

    const numericFields = [
      "ratePerMile", "ratePerMileEmpty", "ratePerLoadPct", "rateHourly",
      "rateFlat", "salaryWeekly", "teamSharePct", "detentionPerHour",
      "layoverFlat", "stopPay",
    ] as const;
    for (const field of numericFields) {
      if (body[field] !== undefined) data[field] = parseNumber(body[field]);
    }

    if (body.detentionFreeHours != null) data.detentionFreeHours = Number(body.detentionFreeHours) || 2;
    if (body.effectiveFrom !== undefined) data.effectiveFrom = parseDate(body.effectiveFrom) ?? existing.effectiveFrom;
    if (body.effectiveTo !== undefined) data.effectiveTo = parseDate(body.effectiveTo);
    if (body.isActive != null) data.isActive = body.isActive === true;
    if (body.notes != null) data.notes = String(body.notes).trim();

    const rule = await prisma.tmsDriverPayRule.update({
      where: { id },
      data,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;

    const existing = await prisma.tmsDriverPayRule.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Pay rule not found." }, { status: 404 });
    }

    await prisma.tmsDriverPayRule.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
