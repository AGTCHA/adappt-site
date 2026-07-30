import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { createSession, verifyPassword } from "@/src/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: { include: { company: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const companyId = user.memberships[0]?.companyId;
  if (!companyId) {
    return NextResponse.json({ error: "No company membership found for this account." }, { status: 403 });
  }

  await createSession(user.id, companyId);
  return NextResponse.json({ ok: true });
}
