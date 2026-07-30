import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { nextWoNumber } from "@/src/lib/maintenance";
import { extractMaintenanceInvoice } from "@/src/lib/openai";
import { bufferToDataUrl, readUpload } from "@/src/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;

    const document = await prisma.maintenanceDocument.findFirst({
      where: { id, companyId },
      include: {
        truck: { select: { id: true, unitNumber: true } },
        workOrder: { select: { id: true, title: true, woNumber: true, status: true } },
      },
    });
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.maintenanceDocument.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (body.action === "reextract") {
      let dataUrl = existing.data;
      if (!dataUrl && existing.storageKey) {
        const buf = await readUpload(existing.storageKey);
        if (buf) dataUrl = bufferToDataUrl(buf, existing.mimeType);
      }
      if (!dataUrl) {
        return NextResponse.json({ error: "No file data to re-extract." }, { status: 400 });
      }
      const result = await extractMaintenanceInvoice({
        dataUrl,
        mimeType: existing.mimeType,
        fileName: existing.fileName,
      });
      if (!result) {
        return NextResponse.json(
          { error: "Couldn't re-extract this document." },
          { status: 422 }
        );
      }
      const document = await prisma.maintenanceDocument.update({
        where: { id },
        data: { extracted: JSON.stringify(result), status: "reviewed" },
        include: {
          truck: { select: { id: true, unitNumber: true } },
          workOrder: { select: { id: true, title: true, woNumber: true } },
        },
      });
      return NextResponse.json({ document });
    }

    if (body.action === "reject") {
      const document = await prisma.maintenanceDocument.update({
        where: { id },
        data: { status: "rejected" },
      });
      return NextResponse.json({ document });
    }

    if (body.action === "apply") {
      const extracted =
        typeof body.extracted === "object"
          ? body.extracted
          : existing.extracted
            ? JSON.parse(existing.extracted)
            : {};

      const truckId = String(body.truckId ?? existing.truckId ?? "");
      if (!truckId) {
        return NextResponse.json({ error: "Select a truck before applying." }, { status: 400 });
      }
      const truck = await prisma.truck.findFirst({ where: { id: truckId, companyId } });
      if (!truck) {
        return NextResponse.json({ error: "Truck not found." }, { status: 404 });
      }

      let vendorId: string | null = body.vendorId ? String(body.vendorId) : null;
      const vendorName = String(extracted.vendor ?? body.vendor ?? "").trim();
      if (!vendorId && vendorName) {
        const found = await prisma.vendor.findFirst({
          where: { companyId, name: { equals: vendorName, mode: "insensitive" } },
        });
        if (found) {
          vendorId = found.id;
        } else {
          const created = await prisma.vendor.create({
            data: { companyId, name: vendorName },
          });
          vendorId = created.id;
        }
      }

      const lines: {
        description: string;
        amount: number;
        isPm?: boolean;
        partNumber?: string;
        vmrsCode?: string;
      }[] = Array.isArray(body.lines)
        ? body.lines
        : Array.isArray(extracted.lineItems)
          ? extracted.lineItems.map(
              (li: { description?: string; amount?: number; partNumber?: string }) => ({
                description: String(li.description ?? "Line"),
                amount: Number(li.amount) || 0,
                partNumber: String(li.partNumber ?? ""),
              })
            )
          : [
              {
                description: String(extracted.description ?? "Invoice"),
                amount: Number(extracted.amount) || 0,
              },
            ];

      const totalAmount = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
      const woNumber = await nextWoNumber(companyId);
      const title =
        String(body.title ?? extracted.description ?? `Invoice ${vendorName || ""}`).trim() ||
        "Invoice work order";

      const workOrder = await prisma.workOrder.create({
        data: {
          companyId,
          truckId,
          vendorId,
          woNumber,
          title,
          description: String(extracted.description ?? ""),
          invoiceRef: String(extracted.invoiceNumber ?? ""),
          status: "open",
          totalAmount,
          odometer:
            extracted.odometer != null ? Number(extracted.odometer) || null : null,
          category: extracted.category === "accident" ? "accident" : "preventative",
          lines: {
            create: lines.map((line) => ({
              description: String(line.description ?? "Line").trim() || "Line",
              amount: Number(line.amount) || 0,
              partNumber: String(line.partNumber ?? ""),
              vmrsCode: String(line.vmrsCode ?? ""),
              isPm: Boolean(line.isPm),
            })),
          },
        },
      });

      const document = await prisma.maintenanceDocument.update({
        where: { id },
        data: {
          status: "applied",
          truckId,
          workOrderId: workOrder.id,
          extracted: JSON.stringify(extracted),
        },
        include: {
          truck: { select: { id: true, unitNumber: true } },
          workOrder: { select: { id: true, title: true, woNumber: true } },
        },
      });

      return NextResponse.json({ document, workOrder });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.extracted === "string") data.extracted = body.extracted;
    if (typeof body.extracted === "object") data.extracted = JSON.stringify(body.extracted);
    if (body.truckId !== undefined) {
      data.truckId = body.truckId ? String(body.truckId) : null;
    }
    if (["pending", "reviewed", "applied", "rejected"].includes(body.status)) {
      data.status = body.status;
    }

    const document = await prisma.maintenanceDocument.update({
      where: { id },
      data,
      include: {
        truck: { select: { id: true, unitNumber: true } },
        workOrder: { select: { id: true, title: true, woNumber: true } },
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("fleet");
    const { id } = await params;
    const existing = await prisma.maintenanceDocument.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    await prisma.maintenanceDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
