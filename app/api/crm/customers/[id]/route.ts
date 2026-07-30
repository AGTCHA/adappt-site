import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("crm");
    const { id } = await params;

    const customer = await prisma.crmCustomer.findFirst({
      where: { id, companyId },
      include: {
        deals: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("crm");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.crmCustomer.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    for (const field of [
      "name",
      "contactName",
      "phone",
      "email",
      "dotNumber",
      "mcNumber",
      "stage",
      "notes",
    ] as const) {
      if (typeof body[field] === "string") data[field] = body[field].trim();
    }

    const customer = await prisma.crmCustomer.update({ where: { id }, data });
    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("crm");
    const { id } = await params;

    const existing = await prisma.crmCustomer.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    await prisma.crmCustomer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
