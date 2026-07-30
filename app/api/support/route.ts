import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));

    const type = ["feedback", "bug", "support"].includes(body.type)
      ? body.type
      : "support";
    const subject = String(body.subject ?? "").trim();
    const text = String(body.body ?? "").trim();

    if (!subject || !text) {
      return NextResponse.json(
        { error: "Please fill in a subject and message." },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        companyId: session.companyId,
        userId: session.userId,
        type,
        subject,
        body: text,
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
