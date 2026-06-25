import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    label?: string;
    amount?: number;
    category?: string;
    person?: string;
    date?: string;
    isRecurring?: boolean;
  };

  const label = String(body.label ?? "").trim();
  const amount = Number(body.amount);
  const category = String(body.category ?? "Other").trim();
  const person = String(body.person ?? "joint");
  const isRecurring = Boolean(body.isRecurring);
  const date = body.date ? new Date(body.date) : new Date();

  if (!label || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Valid label and amount required." }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: { label, amount, category, person, date, isRecurring },
  });

  return NextResponse.json(expense, { status: 201 });
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

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
