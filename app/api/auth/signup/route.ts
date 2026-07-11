import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { createSession, hashPassword } from "@/src/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim();
  const companyName = String(body?.companyName ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!name || !companyName) {
    return NextResponse.json({ error: "Please fill in your name and company name." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in instead." },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), name, companyName },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
