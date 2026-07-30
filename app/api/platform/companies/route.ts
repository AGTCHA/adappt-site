import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { parseEnabledModules } from "@/src/lib/modules";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.isPlatformAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        enabledModules: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            drivers: true,
            trucks: true,
          },
        },
      },
    });

    return NextResponse.json({
      companies: companies.map((c) => ({
        ...c,
        enabledModules: parseEnabledModules(c.enabledModules),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
