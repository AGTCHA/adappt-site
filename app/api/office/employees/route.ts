import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("office");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const department = searchParams.get("department");

    const employees = await prisma.hrEmployee.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
        ...(department ? { department } : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 500,
    });

    return NextResponse.json({ employees });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("office");
    const body = await request.json().catch(() => ({}));

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
    }

    const parseDate = (value: unknown) => {
      if (typeof value !== "string" || !value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const employee = await prisma.hrEmployee.create({
      data: {
        companyId,
        userId: typeof body.userId === "string" ? body.userId : null,
        firstName,
        lastName,
        email: String(body.email ?? "").trim(),
        phone: String(body.phone ?? "").trim(),
        title: String(body.title ?? "").trim(),
        department: String(body.department ?? "").trim(),
        startDate: parseDate(body.startDate),
        status: ["active", "inactive", "terminated"].includes(body.status)
          ? body.status
          : "active",
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
