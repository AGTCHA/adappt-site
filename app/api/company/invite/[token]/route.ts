import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ token: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { token } = await params;

    const invite = await prisma.companyInvite.findUnique({
      where: { token },
    });

    if (!invite || invite.acceptedAt) {
      return NextResponse.json({ error: "Invite not found or already used." }, { status: 404 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }
    if (invite.email.toLowerCase() !== session.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address." },
        { status: 403 }
      );
    }

    const existing = await prisma.companyMembership.findUnique({
      where: {
        companyId_userId: { companyId: invite.companyId, userId: session.userId },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "You are already a member of this company." }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.companyMembership.create({
        data: {
          companyId: invite.companyId,
          userId: session.userId,
          role: invite.role,
        },
      }),
      prisma.companyInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true, companyId: invite.companyId });
  } catch (error) {
    return handleApiError(error);
  }
}
