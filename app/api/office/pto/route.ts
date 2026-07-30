import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("office");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const requests = await prisma.ptoRequest.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
        ...(employeeId ? { employeeId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("office");
    const body = await request.json().catch(() => ({}));

    const employeeId = String(body.employeeId ?? "");
    if (!employeeId) {
      return NextResponse.json({ error: "Employee is required." }, { status: 400 });
    }

    const employee = await prisma.hrEmployee.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Valid start and end dates are required." }, { status: 400 });
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
    }

    const request_ = await prisma.ptoRequest.create({
      data: {
        companyId,
        employeeId,
        startDate,
        endDate,
        type: ["vacation", "sick", "personal", "other"].includes(body.type)
          ? body.type
          : "vacation",
        status: "pending",
        notes: String(body.notes ?? "").trim(),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ request: request_ }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
