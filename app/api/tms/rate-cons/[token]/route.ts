import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError } from "@/src/lib/api";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;

    const signature = await prisma.tmsRateConSignature.findUnique({
      where: { token },
      include: {
        load: {
          select: {
            loadNumber: true,
            origin: true,
            destination: true,
            pickupDate: true,
            deliveryDate: true,
            linehaulRevenue: true,
            fuelSurcharge: true,
            accessorialCharges: true,
            totalRevenue: true,
            equipmentType: true,
            commodity: true,
            weight: true,
            specialInstructions: true,
            stops: {
              orderBy: { sequence: "asc" },
              select: {
                sequence: true,
                type: true,
                locationName: true,
                address: true,
                city: true,
                state: true,
                zip: true,
                appointmentStart: true,
                appointmentEnd: true,
                referenceNumber: true,
                instructions: true,
              },
            },
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!signature) {
      return NextResponse.json({ error: "Rate confirmation not found." }, { status: 404 });
    }

    if (signature.revokedAt) {
      return NextResponse.json({ error: "This rate confirmation has been revoked." }, { status: 410 });
    }

    if (signature.expiresAt && signature.expiresAt < new Date()) {
      return NextResponse.json({ error: "This rate confirmation has expired." }, { status: 410 });
    }

    return NextResponse.json({
      status: signature.status,
      signMethod: signature.signMethod,
      note: signature.note,
      expiresAt: signature.expiresAt,
      signedAt: signature.signedAt,
      signerName: signature.signerName,
      load: signature.load,
      companyName: signature.company?.name ?? "",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const body = await request.json().catch(() => ({}));

    const signature = await prisma.tmsRateConSignature.findUnique({ where: { token } });
    if (!signature) {
      return NextResponse.json({ error: "Rate confirmation not found." }, { status: 404 });
    }

    if (signature.revokedAt) {
      return NextResponse.json({ error: "This rate confirmation has been revoked." }, { status: 410 });
    }

    if (signature.expiresAt && signature.expiresAt < new Date()) {
      return NextResponse.json({ error: "This rate confirmation has expired." }, { status: 410 });
    }

    if (signature.status === "signed") {
      return NextResponse.json({ error: "This rate confirmation has already been signed." }, { status: 409 });
    }

    const signerName = String(body.signerName ?? "").trim();
    if (!signerName) {
      return NextResponse.json({ error: "signerName is required." }, { status: 400 });
    }

    const method = String(body.method ?? signature.signMethod).trim();

    const auditEntry = {
      action: "signed",
      signerName,
      method,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
      timestamp: new Date().toISOString(),
    };

    let auditLog: unknown[] = [];
    try {
      auditLog = JSON.parse(signature.auditJson);
      if (!Array.isArray(auditLog)) auditLog = [];
    } catch {
      auditLog = [];
    }
    auditLog.push(auditEntry);

    const updated = await prisma.tmsRateConSignature.update({
      where: { token },
      data: {
        status: "signed",
        signerName,
        signMethod: method,
        signedAt: new Date(),
        auditJson: JSON.stringify(auditLog),
      },
    });

    return NextResponse.json({
      status: updated.status,
      signerName: updated.signerName,
      signedAt: updated.signedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
