import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const driver = await prisma.driver.findFirst({ where: { id, userId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    let token = driver.applyToken;
    if (!token) {
      token = randomBytes(16).toString("hex");
      await prisma.driver.update({ where: { id }, data: { applyToken: token } });
    }

    // Prefer the actual request origin (respects nginx's forwarded headers)
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    const origin = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : new URL(request.url).origin;
    const link = `${origin}/apply/${token}`;

    // Log the outbound text in the message center
    await prisma.message.create({
      data: {
        userId,
        driverId: id,
        direction: "outbound",
        channel: "sms",
        contactName: `${driver.firstName} ${driver.lastName}`,
        body: `Onboarding link sent: ${link}`,
      },
    });

    const smsBody = encodeURIComponent(
      `Hi ${driver.firstName}, please complete your driver onboarding here: ${link}`
    );
    const smsHref = driver.phone
      ? `sms:${driver.phone}${driver.phone ? `?&body=${smsBody}` : ""}`
      : null;

    return NextResponse.json({ link, smsHref });
  } catch (error) {
    return handleApiError(error);
  }
}
