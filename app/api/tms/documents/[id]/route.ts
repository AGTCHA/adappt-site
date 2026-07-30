import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { companyId } = await requireModule("tms");
    const { id } = await ctx.params;

    const doc = await prisma.tmsDocument.findFirst({ where: { id, companyId } });
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    await prisma.tmsDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
