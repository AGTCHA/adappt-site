import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string; docId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { id, docId } = await params;

    const driver = await prisma.driver.findFirst({ where: { id, companyId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const doc = await prisma.document.findFirst({ where: { id: docId, driverId: id } });
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    await prisma.document.delete({ where: { id: docId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { id, docId } = await params;
    const body = await request.json().catch(() => ({}));

    const driver = await prisma.driver.findFirst({ where: { id, companyId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    const doc = await prisma.document.findFirst({ where: { id: docId, driverId: id } });
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (body.action === "apply") {
      const extracted =
        typeof body.fields === "object"
          ? body.fields
          : doc.extracted
            ? JSON.parse(doc.extracted)
            : {};

      const updates: Record<string, unknown> = {};
      if (typeof extracted.cdlNumber === "string" && extracted.cdlNumber) {
        updates.cdlNumber = extracted.cdlNumber;
      }
      if (typeof extracted.state === "string" && extracted.state) {
        updates.cdlState = extracted.state;
      }
      if (typeof extracted.expirationDate === "string") {
        const date = new Date(extracted.expirationDate);
        if (!Number.isNaN(date.getTime())) {
          if (doc.type === "cdl") updates.cdlExpiry = date;
          if (doc.type === "medcard") updates.medCardExpiry = date;
        }
      }
      if (typeof extracted.endorsements === "string" && extracted.endorsements) {
        updates.endorsements = extracted.endorsements;
      }
      if (typeof extracted.firstName === "string" && extracted.firstName) {
        updates.firstName = extracted.firstName;
      }
      if (typeof extracted.lastName === "string" && extracted.lastName) {
        updates.lastName = extracted.lastName;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.driver.update({ where: { id }, data: updates });
      }

      const document = await prisma.document.update({
        where: { id: docId },
        data: { reviewStatus: "applied" },
      });
      return NextResponse.json({ document, applied: updates });
    }

    if (body.action === "review") {
      const document = await prisma.document.update({
        where: { id: docId },
        data: { reviewStatus: "reviewed" },
      });
      return NextResponse.json({ document });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
