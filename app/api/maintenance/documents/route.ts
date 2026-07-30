import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { storeUpload, dataUrlToBuffer } from "@/src/lib/storage";
import { extractMaintenanceInvoice } from "@/src/lib/openai";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const documents = await prisma.maintenanceDocument.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        truck: { select: { id: true, unitNumber: true } },
        workOrder: { select: { id: true, title: true, woNumber: true } },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("fleet");
    const body = await request.json().catch(() => ({}));

    const fileName = String(body.fileName ?? "invoice.pdf").trim();
    const mimeType = String(body.mimeType ?? "application/pdf");
    const dataUrl = String(body.dataUrl ?? body.data ?? "");

    if (!dataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "File data is required." }, { status: 400 });
    }

    const { buffer, mimeType: detected } = dataUrlToBuffer(dataUrl);
    const mime = mimeType || detected;

    let storageKey = "";
    try {
      const stored = await storeUpload(companyId, fileName, mime, buffer);
      storageKey = stored.key;
    } catch {
      // fallback: keep inline base64 in DB
    }

    let extracted = "";
    let status = "pending";
    try {
      const result = await extractMaintenanceInvoice({
        dataUrl,
        mimeType: mime,
        fileName,
      });
      if (result) {
        extracted = JSON.stringify(result);
        status = "reviewed";
      }
    } catch {
      // leave pending if extract fails
    }

    let truckId: string | null = body.truckId ? String(body.truckId) : null;
    if (!truckId && extracted) {
      try {
        const parsed = JSON.parse(extracted) as { unitNumber?: string };
        if (parsed.unitNumber) {
          const truck = await prisma.truck.findFirst({
            where: {
              companyId,
              unitNumber: { equals: parsed.unitNumber, mode: "insensitive" },
            },
          });
          if (truck) truckId = truck.id;
        }
      } catch {
        /* ignore */
      }
    }

    const document = await prisma.maintenanceDocument.create({
      data: {
        companyId,
        truckId,
        fileName,
        mimeType: mime,
        storageKey,
        data: storageKey ? "" : dataUrl,
        status,
        extracted,
      },
      include: {
        truck: { select: { id: true, unitNumber: true } },
        workOrder: { select: { id: true, title: true, woNumber: true } },
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
