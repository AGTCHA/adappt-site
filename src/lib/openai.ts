import OpenAI from "openai";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

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

export interface ExtractableFile {
  dataUrl: string;
  mimeType: string;
  fileName?: string;
}

export function isExtractableMimeType(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

/** Build the vision/file content part for an image or PDF upload. */
function buildFileParts(file: ExtractableFile): ChatCompletionContentPart[] {
  if (file.mimeType === "application/pdf") {
    return [
      {
        type: "file",
        file: {
          filename: file.fileName ?? "document.pdf",
          file_data: file.dataUrl,
        },
      },
    ];
  }
  return [
    { type: "image_url", image_url: { url: file.dataUrl, detail: "high" } },
  ];
}

type ExtractionResult = Record<string, unknown> | null;

async function runExtraction(
  file: ExtractableFile,
  prompt: string,
  maxTokens = 1500
): Promise<ExtractionResult> {
  const openai = getClient();
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, ...buildFileParts(file)],
        },
      ],
      max_tokens: maxTokens,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) return null;
    return JSON.parse(
      text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    ) as Record<string, unknown>;
  } catch (error) {
    console.error("OpenAI extraction failed:", error);
    return null;
  }
}

// ── Driver documents (CDL / med card) ────────────────────────────────────────

export async function extractDriverDocument(
  file: ExtractableFile,
  type: "cdl" | "medcard" | "other"
): Promise<ExtractionResult> {
  const prompts: Record<string, string> = {
    cdl: `You are extracting data from a US Commercial Driver's License (CDL).
Return a JSON object with these keys (use null when unreadable):
firstName, lastName, cdlNumber, state (2-letter code), expirationDate (YYYY-MM-DD), dateOfBirth (YYYY-MM-DD), endorsements (string, e.g. "H,N,T"), licenseClass (A/B/C).
Also include "fieldConfidence": an object mapping each extracted key to a 0-100 confidence score.`,
    medcard: `You are extracting data from a US DOT Medical Examiner's Certificate (med card).
Return a JSON object with these keys (use null when unreadable):
driverName, expirationDate (YYYY-MM-DD), examinerName, restrictions (string or null).
Also include "fieldConfidence": an object mapping each extracted key to a 0-100 confidence score.`,
    other: `Extract any structured information from this document. Return a JSON object with keys: documentType, summary, and any obvious fields like names or dates.`,
  };

  return runExtraction(file, prompts[type] ?? prompts.other);
}

// ── Maintenance invoices ─────────────────────────────────────────────────────
// Prompt rules distilled from a battle-tested production extraction pipeline
// (EXTENSION-column arithmetic, ghost-doubling, bottom fees, PAID watermarks).

const INVOICE_PROMPT = `You are an expert at reading fleet maintenance vendor invoices and truck repair bills. Extract ALL information from this document into strict JSON.

CRITICAL DISAMBIGUATION RULES:
- unitNumber: the TRUCK or TRAILER fleet number the work was performed ON (the vehicle being serviced).
  It is NOT the service order number, invoice number, work order number, bill number, or PO number.
  Look for fields labeled "Unit #", "Unit Number", "Fleet #", "Truck #", "Trailer #", "Equipment #", or "Vehicle #".
  Never use "Service Order"/"SO #" (that is a vendor reference), "Invoice #"/"Bill #" (that goes in invoiceNumber), "Customer PO", or "Authorization #".
  Unit numbers are typically 2-6 character identifiers like 101, 5700, 48216C.
- invoiceNumber: the VENDOR'S invoice/bill/document number ("Invoice #", "Bill #", "Inv #", "RO #").

LINE-ITEM RULES (the most common sources of error):

RULE A — USE THE EXTENSION COLUMN. Many invoices (Love's, Speedco, TA, Pilot, Petro, dealer shops) show several price columns per row:
  QTY | PRODUCT (unit price) | LABOR (rate) | EXTENSION (line total)
The line item "amount" is the EXTENSION / EXT. / AMOUNT / LINE TOTAL column — the right-most price column — NOT the per-unit price, NOT the sum of multiple columns.
If quantity > 1, amount must equal quantity × per-unit price. If your number equals the per-unit value, multiply by quantity.
Example: "24in WIPER BLADE, QTY 2, PRODUCT 19.99, EXTENSION 39.98" → amount: 39.98 (NOT 19.99).
Labor lines often record HOURS in the QTY column with a per-hour rate ("pressure test, QTY 8.20, LABOR 143.99, EXTENSION 1180.72" → amount: 1180.72).
Negative credit lines (used casings, core returns) keep their negative amount.

RULE B — CAPTURE BOTTOM-OF-INVOICE FEES AS LINE ITEMS. "Shop Supplies", "Hazmat Fee", "Disposal Fee", "Environmental Fee", "EPA Fee", "Freight", "Credit Card Fee" listed in the totals section are each their own line item with the literal label as description.

RULE C — SALES TAX goes in the top-level "tax" field, NEVER as a line item.

RULE D — SELF-CHECK: sum of lineItems amounts + tax should equal totalAmount (within $1 or 1%). If it doesn't reconcile, re-read the invoice — you probably double-counted (Rule A) or missed a bottom fee (Rule B). Lower the lineItems confidence if you cannot reconcile.

RULE E — PAID / ZERO-BALANCE INVOICES: totalAmount MUST be the original invoice GRAND TOTAL for the work. If "Balance Due" is $0 because the invoice was paid, use Subtotal + tax (or sum of line items + tax) — NEVER report 0 just because the invoice is marked PAID.

RULE F — CATEGORY: "preventative" for routine/scheduled work (PM service, oil change, filters, lube, inspections, DOT annual, tires, brakes, coolant/transmission service, DPF cleaning) AND for unscheduled component failures (alternator, turbo, starter, hoses, electrical, towing).
"accident" ONLY for collision/body/damage repairs (body work, paint, frame, glass replacement after a crash, accident towing). When in doubt use "preventative".

RULE G — PM/DOT FLAGS per line item:
  isPm: true when the line is preventive maintenance ("PM service", "PM A/B/C", "oil change", "LOF", filters on schedule, "chassis lube", "coolant flush", "scheduled service").
  isDot: true when the line is a DOT annual inspection ("DOT inspection", "annual inspection", "FMCSA/396.17 inspection", "annual sticker").
A failed-component repair is neither. When in doubt, false.

Return this exact JSON shape (null for unreadable fields):
{
  "vendor": "shop name",
  "vendorLocation": "city, ST or chain store # if printed",
  "invoiceNumber": "string or null",
  "date": "YYYY-MM-DD",
  "unitNumber": "string or null",
  "vin": "17-char VIN or null",
  "odometer": number or null,
  "description": "short summary of the work performed, max 120 chars",
  "category": "preventative" or "accident",
  "lineItems": [{ "description": "string", "amount": number, "quantity": number or null, "isPm": boolean, "isDot": boolean }],
  "subtotal": number or null,
  "tax": number or null,
  "totalAmount": number,
  "fieldConfidence": { "vendor": 0-100, "date": 0-100, "unitNumber": 0-100, "odometer": 0-100, "totalAmount": 0-100, "lineItems": 0-100, "category": 0-100 }
}`;

export async function extractMaintenanceInvoice(
  file: ExtractableFile
): Promise<ExtractionResult> {
  return runExtraction(file, INVOICE_PROMPT, 8192);
}

// ── Driver applications ──────────────────────────────────────────────────────

const APPLICATION_PROMPT = `You are an expert at extracting data from CDL/trucking driver employment applications (Tenstreet format and similar).

Look through ALL pages of this application for driver information and previous-employer records.

Return this exact JSON shape (empty string "" for any field you cannot find; dates as YYYY-MM-DD; phone numbers as digits only):
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "5551234567",
  "email": "john@example.com",
  "city": "Chicago",
  "state": "IL",
  "dateOfBirth": "1990-01-15",
  "cdlNumber": "D123456789",
  "cdlState": "IL",
  "cdlExpiration": "2028-06-15",
  "medicalCardExpiration": "2026-03-20",
  "yearsExperience": "5",
  "endorsements": "H, N",
  "preferredRoute": "local" | "regional" | "otr" | "",
  "employers": [
    {
      "name": "Company Name",
      "city": "Chicago",
      "state": "IL",
      "phone": "5551234567",
      "position": "OTR Driver",
      "from": "2020-01",
      "to": "2023-06"
    }
  ],
  "fieldConfidence": { "firstName": 0-100, "lastName": 0-100, "phone": 0-100, "email": 0-100, "cdlNumber": 0-100, "cdlExpiration": 0-100, "medicalCardExpiration": 0-100, "yearsExperience": 0-100 }
}

Notes:
- firstName/lastName: split the legal name; middle names/initials belong with firstName.
- endorsements: letters from the CDL section (H=Hazmat, N=Tanker, T=Doubles/Triples, X=Tanker+Hazmat), comma separated.
- preferredRoute: only if the application states a preference for local/regional/OTR work, otherwise "".
- List employers most recent first, up to 8.`;

export async function extractDriverApplication(
  file: ExtractableFile
): Promise<ExtractionResult> {
  return runExtraction(file, APPLICATION_PROMPT, 8192);
}
