import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const { companyId } = await requireModule("tms");

    const partners = await prisma.tmsEdiPartner.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { messages: true, inbox: true } },
      },
    });

    return NextResponse.json({ partners });
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
      return NextResponse.json({ error: "Partner name is required." }, { status: 400 });
    }

    const transport = ["sftp", "as2", "api", "email"].includes(String(body.transport))
      ? String(body.transport)
      : "sftp";

    let configJson = "{}";
    if (body.config && typeof body.config === "object") {
      try {
        configJson = JSON.stringify(body.config);
      } catch {
        /* keep default */
      }
    }

    const partner = await prisma.tmsEdiPartner.create({
      data: {
        companyId,
        name,
        scac: String(body.scac ?? "").trim(),
        transport,
        isEnabled: body.isEnabled !== false,
        configJson,
      },
    });

    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
