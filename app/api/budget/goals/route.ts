import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.savingsGoal.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { name?: string; target?: number; saved?: number };
  const name = String(body.name ?? "").trim();
  const target = Number(body.target);
  const saved = Number.isFinite(Number(body.saved)) ? Number(body.saved) : 0;

  if (!name || !Number.isFinite(target) || target <= 0) {
    return NextResponse.json({ error: "Valid name and target required." }, { status: 400 });
  }

  const goal = await prisma.savingsGoal.create({
    data: { name, target, saved: Math.max(0, saved) },
  });
  return NextResponse.json(goal, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    id?: number;
    name?: string;
    target?: number;
    saved?: number;
  };
  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const data: { name?: string; target?: number; saved?: number } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (Number.isFinite(Number(body.target)) && Number(body.target) > 0) {
    data.target = Number(body.target);
  }
  if (Number.isFinite(Number(body.saved))) data.saved = Math.max(0, Number(body.saved));

  const goal = await prisma.savingsGoal.update({ where: { id }, data });
  return NextResponse.json(goal);
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

  await prisma.savingsGoal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
