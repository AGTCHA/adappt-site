import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { PAY_RULE_TYPES } from "@/src/lib/tms/constants";
import { parseDate, parseNumber } from "@/src/lib/tms/parse";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const activeOnly = searchParams.get("active");

    const where: Record<string, unknown> = { companyId };
    if (driverId) where.driverId = driverId;
    if (activeOnly === "true") where.isActive = true;

    const rules = await prisma.tmsDriverPayRule.findMany({
      where,
      orderBy: { effectiveFrom: "desc" },
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const ruleType = String(body.ruleType ?? "per_mile");
    if (!(PAY_RULE_TYPES as readonly string[]).includes(ruleType)) {
      return NextResponse.json(
        { error: `Invalid ruleType. Must be one of: ${PAY_RULE_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const driverId = body.driverId ? String(body.driverId) : null;
    if (driverId) {
      const driver = await prisma.driver.findFirst({ where: { id: driverId, companyId } });
      if (!driver) {
        return NextResponse.json({ error: "Driver not found." }, { status: 404 });
      }
    }

    const rule = await prisma.tmsDriverPayRule.create({
      data: {
        companyId,
        driverId,
        ruleType,
        ratePerMile: parseNumber(body.ratePerMile),
        ratePerMileEmpty: parseNumber(body.ratePerMileEmpty),
        ratePerLoadPct: parseNumber(body.ratePerLoadPct),
        rateHourly: parseNumber(body.rateHourly),
        rateFlat: parseNumber(body.rateFlat),
        salaryWeekly: parseNumber(body.salaryWeekly),
        teamSharePct: parseNumber(body.teamSharePct),
        detentionPerHour: parseNumber(body.detentionPerHour),
        detentionFreeHours: Number(body.detentionFreeHours) || 2,
        layoverFlat: parseNumber(body.layoverFlat),
        stopPay: parseNumber(body.stopPay),
        effectiveFrom: parseDate(body.effectiveFrom) ?? new Date(),
        effectiveTo: parseDate(body.effectiveTo),
        isActive: body.isActive !== false,
        notes: String(body.notes ?? "").trim(),
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
