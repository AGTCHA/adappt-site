import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const { companyId } = await requireModule("recruiting");
    const jobAds = await prisma.jobAd.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { leads: true } } },
    });
    return NextResponse.json({ jobAds });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("recruiting");
    const body = await request.json().catch(() => ({}));

    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Please give the ad a title." }, { status: 400 });
    }

    const jobAd = await prisma.jobAd.create({
      data: {
        companyId,
        title,
        description: String(body.description ?? "").trim(),
        payRange: String(body.payRange ?? "").trim(),
        location: String(body.location ?? "").trim(),
        webhookToken: randomBytes(16).toString("hex"),
      },
      include: { _count: { select: { leads: true } } },
    });

    return NextResponse.json({ jobAd }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
