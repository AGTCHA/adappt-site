import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type Params = { params: Promise<{ token: string }> };

/**
 * Public webhook: ad platforms (Facebook Lead Ads, Zapier, etc.) POST leads here.
 * Accepts flexible payloads — looks for common field names.
 */
export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  const jobAd = await prisma.jobAd.findUnique({ where: { webhookToken: token } });
  if (!jobAd) {
    return NextResponse.json({ error: "Unknown webhook." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = body?.[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  const name = pick("name", "full_name", "fullName", "first_name");
  const phone = pick("phone", "phone_number", "phoneNumber", "mobile");
  const email = pick("email", "email_address", "emailAddress");

  const lead = await prisma.lead.create({
    data: {
      companyId: jobAd.companyId,
      jobAdId: jobAd.id,
      name,
      phone,
      email,
      source: pick("source", "platform") || "webhook",
      payload: JSON.stringify(body).slice(0, 8000),
    },
  });

  await prisma.message.create({
    data: {
      companyId: jobAd.companyId,
      direction: "inbound",
      channel: "system",
      contactName: name || "New lead",
      body: `New lead from "${jobAd.title}"${phone ? ` · ${phone}` : ""}${email ? ` · ${email}` : ""}`,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
