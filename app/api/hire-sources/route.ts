import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const { companyId } = await requireModule("recruiting");
    const sources = await prisma.hireSource.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ sources });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("recruiting");
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    const source = await prisma.hireSource.create({
      data: { companyId, name, active: body.active !== false },
    });
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
