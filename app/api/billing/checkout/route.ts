import { NextResponse } from "next/server";
import { requireSession } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

export async function POST(request: Request) {
  try {
    await requireSession();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured.", configured: false },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const plan = String(body.plan ?? "pro");

    // Stub: real Stripe checkout session would be created here
    return NextResponse.json({
      configured: true,
      checkoutUrl: null,
      plan,
      message: "Stripe checkout session creation is not yet implemented.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
