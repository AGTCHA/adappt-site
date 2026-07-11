import { NextResponse } from "next/server";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { extractMaintenanceInvoice, isAiConfigured } from "@/src/lib/openai";

export async function POST(request: Request) {
  try {
    await requireUserId();

    if (!isAiConfigured()) {
      return NextResponse.json(
        {
          error:
            "AI extraction isn't set up yet. Add an OpenAI API key to enable it, or enter the invoice details manually.",
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const dataUrl = String(body.dataUrl ?? "");
    const mimeType = String(body.mimeType ?? "");

    if (!dataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Invalid file upload." }, { status: 400 });
    }
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a photo or image of the invoice (JPG, PNG, or HEIC screenshot)." },
        { status: 400 }
      );
    }

    const extracted = await extractMaintenanceInvoice(dataUrl);
    if (!extracted) {
      return NextResponse.json(
        { error: "Couldn't read this invoice. Try a clearer photo, or enter the details manually." },
        { status: 422 }
      );
    }

    return NextResponse.json({ extracted });
  } catch (error) {
    return handleApiError(error);
  }
}
