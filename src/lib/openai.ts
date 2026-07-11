import OpenAI from "openai";

let client: OpenAI | null = null;

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

type ExtractionResult = Record<string, unknown> | null;

async function extractFromImage(
  dataUrl: string,
  prompt: string
): Promise<ExtractionResult> {
  const openai = getClient();
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      max_tokens: 800,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) return null;
    return JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    console.error("OpenAI extraction failed:", error);
    return null;
  }
}

export async function extractDriverDocument(
  dataUrl: string,
  type: "cdl" | "medcard" | "other"
): Promise<ExtractionResult> {
  const prompts: Record<string, string> = {
    cdl: `You are extracting data from a photo of a US Commercial Driver's License (CDL).
Return a JSON object with these keys (use null when unreadable):
firstName, lastName, cdlNumber, state (2-letter code), expirationDate (YYYY-MM-DD), dateOfBirth (YYYY-MM-DD), endorsements (string, e.g. "H,N,T"), licenseClass (A/B/C).`,
    medcard: `You are extracting data from a photo of a US DOT Medical Examiner's Certificate (med card).
Return a JSON object with these keys (use null when unreadable):
driverName, expirationDate (YYYY-MM-DD), examinerName, restrictions (string or null).`,
    other: `Extract any structured information from this document. Return a JSON object with keys: documentType, summary, and any obvious fields like names or dates.`,
  };

  return extractFromImage(dataUrl, prompts[type] ?? prompts.other);
}

export async function extractMaintenanceInvoice(
  dataUrl: string
): Promise<ExtractionResult> {
  const prompt = `You are extracting data from a photo or scan of a truck repair/maintenance invoice.
Return a JSON object with these keys (use null when unreadable):
vendor (shop name), date (YYYY-MM-DD), totalAmount (number, USD), odometer (number or null),
description (short summary of the work performed, max 120 chars),
category (exactly "preventative" for routine maintenance like oil changes, PM services, inspections, tires, brakes, filters — or "accident" for collision/body/damage repairs),
lineItems (array of {description, amount}).`;

  return extractFromImage(dataUrl, prompt);
}
