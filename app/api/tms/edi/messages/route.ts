import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const { searchParams } = new URL(request.url);

    const where: Record<string, unknown> = { companyId };

    const partnerId = searchParams.get("partnerId");
    if (partnerId) where.partnerId = partnerId;

    const direction = searchParams.get("direction");
    if (direction === "inbound" || direction === "outbound") where.direction = direction;

    const transactionSet = searchParams.get("transactionSet");
    if (transactionSet) where.transactionSet = transactionSet;

    const status = searchParams.get("status");
    if (status) where.status = status;

    const loadNumber = searchParams.get("loadNumber");
    if (loadNumber) {
      where.loadNumber = { contains: loadNumber, mode: "insensitive" };
    }

    const messages = await prisma.tmsEdiMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        partner: { select: { id: true, name: true, scac: true } },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return handleApiError(error);
  }
}
