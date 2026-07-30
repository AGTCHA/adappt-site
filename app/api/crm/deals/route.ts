import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("crm");
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const stage = searchParams.get("stage");

    const deals = await prisma.crmDeal.findMany({
      where: {
        companyId,
        ...(customerId ? { customerId } : {}),
        ...(stage ? { stage } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ deals });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("crm");
    const body = await request.json().catch(() => ({}));

    const customerId = String(body.customerId ?? "");
    const title = String(body.title ?? "").trim();
    if (!customerId || !title) {
      return NextResponse.json({ error: "Customer and title are required." }, { status: 400 });
    }

    const customer = await prisma.crmCustomer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const parseDate = (value: unknown) => {
      if (typeof value !== "string" || !value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const deal = await prisma.crmDeal.create({
      data: {
        companyId,
        customerId,
        title,
        value: body.value != null ? Number(body.value) || null : null,
        stage: typeof body.stage === "string" ? body.stage : "prospect",
        expectedClose: parseDate(body.expectedClose),
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
