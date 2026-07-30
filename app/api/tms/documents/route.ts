import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { DOC_TYPES } from "@/src/lib/tms/constants";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get("loadId");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { companyId };
    if (loadId) where.loadId = loadId;
    if (type) where.type = type;

    const documents = await prisma.tmsDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        loadId: true,
        type: true,
        fileName: true,
        mimeType: true,
        title: true,
        notes: true,
        validationStatus: true,
        uploadedBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, userId, name } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const loadId = body.loadId ? String(body.loadId) : null;
    if (loadId) {
      const load = await prisma.tmsLoad.findFirst({ where: { id: loadId, companyId } });
      if (!load) {
        return NextResponse.json({ error: "Load not found." }, { status: 404 });
      }
    }

    const docType = (DOC_TYPES as readonly string[]).includes(String(body.type))
      ? String(body.type)
      : "other";

    const fileName = String(body.fileName ?? "").trim();
    if (!fileName) {
      return NextResponse.json({ error: "fileName is required." }, { status: 400 });
    }

    const document = await prisma.tmsDocument.create({
      data: {
        companyId,
        loadId,
        type: docType,
        fileName,
        mimeType: String(body.mimeType ?? "application/octet-stream").trim(),
        dataBase64: String(body.dataBase64 ?? ""),
        title: String(body.title ?? "").trim(),
        notes: String(body.notes ?? "").trim(),
        uploadedBy: name || userId,
        validationStatus: "uploaded",
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
