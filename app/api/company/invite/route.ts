import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

function canManageTeam(role: string, isPlatformAdmin: boolean) {
  return isPlatformAdmin || role === "owner" || role === "admin";
}

export async function GET() {
  try {
    const session = await requireSession();
    if (!canManageTeam(session.role, session.isPlatformAdmin)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const invites = await prisma.companyInvite.findMany({
      where: { companyId: session.companyId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!canManageTeam(session.role, session.isPlatformAdmin)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = ["owner", "admin", "member", "viewer"].includes(body.role)
      ? body.role
      : "viewer";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const existingMember = await prisma.companyMembership.findFirst({
      where: {
        companyId: session.companyId,
        user: { email },
      },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: "This person is already on your team." },
        { status: 409 }
      );
    }

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 86_400_000);

    const invite = await prisma.companyInvite.create({
      data: {
        companyId: session.companyId,
        email,
        role,
        token,
        expiresAt,
      },
    });

    return NextResponse.json({ invite: { ...invite, token } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
