import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET() {
  try {
    const userId = await requireUserId();
    const jobAds = await prisma.jobAd.findMany({
      where: { userId },
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
    const userId = await requireUserId();
    const body = await request.json().catch(() => ({}));

    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Please give the ad a title." }, { status: 400 });
    }

    const jobAd = await prisma.jobAd.create({
      data: {
        userId,
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
