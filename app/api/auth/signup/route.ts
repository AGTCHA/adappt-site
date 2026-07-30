import { NextResponse } from "next/server";
import { createCompanyWithOwner, createSession } from "@/src/lib/auth";

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

  try {
    const { user, company } = await createCompanyWithOwner({
      email,
      password,
      name,
      companyName,
    });
    await createSession(user.id, company.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in instead." },
        { status: 409 }
      );
    }
    throw error;
  }
}
