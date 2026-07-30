import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const active = searchParams.get("active");

    const where: Record<string, unknown> = { companyId };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { mcNumber: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
        { contactEmail: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { state: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.tmsCustomer.findMany({
      where,
      orderBy: { name: "asc" },
      take: 500,
      include: {
        _count: { select: { loads: true, invoices: true } },
      },
    });

    const customers = rows.map((c) => ({
      ...c,
      status: c.isActive ? "active" : "inactive",
      creditLimit: null as number | null,
      billingAddress: [c.address, c.city, c.state, c.zip].filter(Boolean).join(", "),
      // UI historically called .replace on a string; expose both
      paymentTermsLabel: `Net ${c.paymentTerms}`,
      loadCount: c._count.loads,
      invoiceCount: c._count.invoices,
    }));

    return NextResponse.json({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }

    const customer = await prisma.tmsCustomer.create({
      data: {
        companyId,
        name,
        mcNumber: String(body.mcNumber ?? "").trim(),
        dotNumber: String(body.dotNumber ?? "").trim(),
        address: String(body.address ?? "").trim(),
        city: String(body.city ?? "").trim(),
        state: String(body.state ?? "").trim(),
        zip: String(body.zip ?? "").trim(),
        contactName: String(body.contactName ?? "").trim(),
        contactEmail: String(body.contactEmail ?? "").trim(),
        contactPhone: String(body.contactPhone ?? "").trim(),
        creditRating: String(body.creditRating ?? "B").trim(),
        paymentTerms: Number(body.paymentTerms) || 30,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
