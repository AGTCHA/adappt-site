import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const { searchParams } = new URL(request.url);
    const truckId = searchParams.get("truckId");

    const records = await prisma.maintenanceRecord.findMany({
      where: { companyId, ...(truckId ? { truckId } : {}) },
      orderBy: { date: "desc" },
      take: 200,
      include: { truck: { select: { id: true, unitNumber: true } } },
    });
    return NextResponse.json({ records });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const body = await request.json().catch(() => ({}));

    const truckId = String(body.truckId ?? "");
    const amount = Number(body.amount);

    const truck = await prisma.truck.findFirst({ where: { id: truckId, companyId } });
    if (!truck) {
      return NextResponse.json({ error: "Truck not found." }, { status: 404 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid amount." },
        { status: 400 }
      );
    }

    const date = body.date ? new Date(body.date) : new Date();
    const odometer =
      body.odometer != null && body.odometer !== "" ? Number(body.odometer) : null;

    const record = await prisma.maintenanceRecord.create({
      data: {
        companyId,
        truckId,
        date: Number.isNaN(date.getTime()) ? new Date() : date,
        vendor: String(body.vendor ?? "").trim(),
        description: String(body.description ?? "").trim(),
        amount,
        category: body.category === "accident" ? "accident" : "preventative",
        odometer: Number.isFinite(odometer as number) ? odometer : null,
        invoiceFileName: String(body.invoiceFileName ?? ""),
        extracted: typeof body.extracted === "string" ? body.extracted : "",
      },
      include: { truck: { select: { id: true, unitNumber: true } } },
    });

    if (record.odometer && record.odometer > truck.mileage) {
      await prisma.truck.update({
        where: { id: truckId },
        data: { mileage: record.odometer },
      });
    }

    if (record.odometer != null && Number.isFinite(record.odometer)) {
      await prisma.odometerSnapshot.create({
        data: {
          companyId,
          truckId,
          reading: record.odometer,
          source: "invoice",
          recordedAt: record.date,
        },
      });
    }

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
