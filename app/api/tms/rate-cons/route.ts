import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const loadId = String(body.loadId ?? "").trim();
    if (!loadId) {
      return NextResponse.json({ error: "loadId is required." }, { status: 400 });
    }

    const load = await prisma.tmsLoad.findFirst({ where: { id: loadId, companyId } });
    if (!load) {
      return NextResponse.json({ error: "Load not found." }, { status: 404 });
    }

    const token = randomBytes(24).toString("hex");
    const expiresDays = Number(body.expiresDays) || 7;
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    const signature = await prisma.tmsRateConSignature.create({
      data: {
        companyId,
        loadId,
        token,
        recipientEmail: String(body.recipientEmail ?? "").trim(),
        status: "pending",
        signMethod: String(body.signMethod ?? "click").trim(),
        note: String(body.note ?? "").trim(),
        expiresAt,
      },
    });

    return NextResponse.json({
      signature,
      signUrl: `/rate-con/sign/${token}`,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
