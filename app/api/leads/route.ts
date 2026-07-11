import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const jobAdId = searchParams.get("jobAdId");

    const leads = await prisma.lead.findMany({
      where: { userId, ...(jobAdId ? { jobAdId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { jobAd: { select: { id: true, title: true } } },
    });
    return NextResponse.json({ leads });
  } catch (error) {
    return handleApiError(error);
  }
}
