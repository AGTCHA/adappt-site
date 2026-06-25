import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incomes = await prisma.income.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(incomes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    label?: string;
    amount?: number;
    person?: string;
    frequency?: string;
  };

  const label = String(body.label ?? "").trim();
  const amount = Number(body.amount);
  const person = String(body.person ?? "joint");
  const frequency = String(body.frequency ?? "monthly");

  if (!label || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Valid label and amount required." }, { status: 400 });
  }

  const income = await prisma.income.create({
    data: { label, amount, person, frequency },
  });

  return NextResponse.json(income, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
