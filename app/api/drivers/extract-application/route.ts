import { NextResponse } from "next/server";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import {
  extractDriverApplication,
  isAiConfigured,
  isExtractableMimeType,
} from "@/src/lib/openai";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    await requireModule("recruiting");

    if (!isAiConfigured()) {
      return NextResponse.json(
        {
          error:
            "AI extraction isn't set up yet. Add an OpenAI API key to enable it, or type the application in manually.",
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const dataUrl = String(body.dataUrl ?? "");
    const mimeType = String(body.mimeType ?? "");
    const fileName = String(body.fileName ?? "application");

    if (!dataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Invalid file upload." }, { status: 400 });
    }
    if (!isExtractableMimeType(mimeType)) {
      return NextResponse.json(
        { error: "Please upload a PDF or photo of the driver's application." },
        { status: 400 }
      );
    }
    if (dataUrl.length > 20_000_000) {
      return NextResponse.json(
        { error: "File is too large. Please upload a file under 14MB." },
        { status: 400 }
      );
    }

    const extracted = await extractDriverApplication({ dataUrl, mimeType, fileName });
    if (!extracted || (!extracted.firstName && !extracted.lastName)) {
      return NextResponse.json(
        {
          error:
            "Couldn't find a driver name in this file. Check it's a driver application, or type the details in manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ extracted });
  } catch (error) {
    return handleApiError(error);
  }
}
