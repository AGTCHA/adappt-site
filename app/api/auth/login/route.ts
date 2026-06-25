import { NextRequest, NextResponse } from "next/server";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const valid = await verifyCredentials(email, password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await createSession(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout failed", error);
    return NextResponse.json({ error: "Logout failed." }, { status: 500 });
  }
}
