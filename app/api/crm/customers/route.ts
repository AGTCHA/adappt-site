import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("crm");
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");

    const customers = await prisma.crmCustomer.findMany({
      where: { companyId, ...(stage ? { stage } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { _count: { select: { deals: true } } },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("crm");
    const body = await request.json().catch(() => ({}));

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }

    const customer = await prisma.crmCustomer.create({
      data: {
        companyId,
        name,
        contactName: String(body.contactName ?? "").trim(),
        phone: String(body.phone ?? "").trim(),
        email: String(body.email ?? "").trim(),
        dotNumber: String(body.dotNumber ?? "").trim(),
        mcNumber: String(body.mcNumber ?? "").trim(),
        stage: typeof body.stage === "string" ? body.stage : "lead",
        notes: String(body.notes ?? "").trim(),
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
