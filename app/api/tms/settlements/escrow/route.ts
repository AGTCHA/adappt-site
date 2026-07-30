import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { parseNumber } from "@/src/lib/tms/parse";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");

    const where: Record<string, unknown> = { companyId };
    if (driverId) where.driverId = driverId;

    const accounts = await prisma.tmsEscrowAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        transactions: { orderBy: { createdAt: "desc" as const }, take: 10 },
        _count: { select: { recurringItems: true, transactions: true } },
      },
    });

    return NextResponse.json({ accounts });
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

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Account name is required." }, { status: 400 });
    }

    const account = await prisma.tmsEscrowAccount.create({
      data: {
        companyId,
        driverId,
        name,
        targetAmount: parseNumber(body.targetAmount),
        balance: 0,
        isActive: body.isActive !== false,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { companyId, userId, name: userName } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const accountId = String(body.accountId ?? "").trim();
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required." }, { status: 400 });
    }

    const account = await prisma.tmsEscrowAccount.findFirst({
      where: { id: accountId, companyId },
    });
    if (!account) {
      return NextResponse.json({ error: "Escrow account not found." }, { status: 404 });
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "A positive withdrawal amount is required." }, { status: 400 });
    }

    if (amount > account.balance) {
      return NextResponse.json(
        { error: `Insufficient balance. Current balance: $${account.balance.toFixed(2)}` },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const newBalance = account.balance - amount;

      const updated = await tx.tmsEscrowAccount.update({
        where: { id: accountId },
        data: { balance: newBalance },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      const txn = await tx.tmsEscrowTxn.create({
        data: {
          escrowAccountId: accountId,
          amount: -amount,
          balanceAfter: newBalance,
          description: String(body.reason ?? "Withdrawal").trim(),
          createdBy: userName || userId,
        },
      });

      return { account: updated, transaction: txn };
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
