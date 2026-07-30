import { NextResponse } from "next/server";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  extractMaintenanceInvoice,
  isAiConfigured,
  isExtractableMimeType,
} from "@/src/lib/openai";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    await requireModule("fleet");

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
    const fileName = String(body.fileName ?? "invoice");

    if (!dataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Invalid file upload." }, { status: 400 });
    }
    if (!isExtractableMimeType(mimeType)) {
      return NextResponse.json(
        { error: "Please upload a photo or PDF of the invoice." },
        { status: 400 }
      );
    }
    if (dataUrl.length > 20_000_000) {
      return NextResponse.json(
        { error: "File is too large. Please upload a file under 14MB." },
        { status: 400 }
      );
    }

    const extracted = await extractMaintenanceInvoice({ dataUrl, mimeType, fileName });
    if (!extracted) {
      return NextResponse.json(
        { error: "Couldn't read this invoice. Try a clearer photo or PDF, or enter the details manually." },
        { status: 422 }
      );
    }

    return NextResponse.json({ extracted });
  } catch (error) {
    return handleApiError(error);
  }
}
