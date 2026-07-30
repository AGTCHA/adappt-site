import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { parseDate, parseNumber } from "@/src/lib/tms/parse";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = { companyId };
    if (driverId) where.driverId = driverId;
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    const items = await prisma.tmsRecurringItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        escrowAccount: { select: { id: true, name: true, balance: true } },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
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

    const kind = String(body.kind ?? "deduction").trim();

    let escrowAccountId: string | null = null;
    if (body.escrowAccountId) {
      const account = await prisma.tmsEscrowAccount.findFirst({
        where: { id: String(body.escrowAccountId), companyId },
      });
      if (!account) {
        return NextResponse.json({ error: "Escrow account not found." }, { status: 404 });
      }
      escrowAccountId = account.id;
    }

    const totalBalance = parseNumber(body.totalBalance);

    const item = await prisma.tmsRecurringItem.create({
      data: {
        companyId,
        driverId,
        kind,
        description,
        amount: parseNumber(body.amount),
        pctOfGross: parseNumber(body.pctOfGross),
        escrowAccountId,
        totalBalance,
        remainingBalance: totalBalance,
        isActive: body.isActive !== false,
        startDate: parseDate(body.startDate) ?? new Date(),
        endDate: parseDate(body.endDate),
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        escrowAccount: { select: { id: true, name: true, balance: true } },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
