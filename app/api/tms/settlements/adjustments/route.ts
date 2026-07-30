import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { parseDate } from "@/src/lib/tms/parse";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const unapplied = searchParams.get("unapplied");
    const settlementId = searchParams.get("settlementId");

    const where: Record<string, unknown> = { companyId };
    if (driverId) where.driverId = driverId;
    if (unapplied === "true") where.settlementId = null;
    if (settlementId) where.settlementId = settlementId;

    const adjustments = await prisma.tmsSettlementAdjustment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        settlement: {
          select: { id: true, settlementNumber: true, status: true },
        },
      },
    });

    return NextResponse.json({ adjustments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, userId, name: userName } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const driverId = String(body.driverId ?? "").trim();
    if (!driverId) {
      return NextResponse.json({ error: "driverId is required." }, { status: 400 });
    }

    const driver = await prisma.driver.findFirst({ where: { id: driverId, companyId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const description = String(body.description ?? "").trim();
    if (!description) {
      return NextResponse.json({ error: "description is required." }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json({ error: "A non-zero amount is required." }, { status: 400 });
    }

    const adjustment = await prisma.tmsSettlementAdjustment.create({
      data: {
        companyId,
        driverId,
        kind: String(body.kind ?? "bonus").trim(),
        description,
        amount,
        entryDate: parseDate(body.entryDate) ?? new Date(),
        createdBy: userName || userId,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ adjustment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
