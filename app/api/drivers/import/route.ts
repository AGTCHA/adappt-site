import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

interface ImportRow {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  cdlNumber?: string;
  cdlState?: string;
  cdlExpiry?: string;
  medCardExpiry?: string;
  experienceYears?: string | number;
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json().catch(() => ({}));
    const rows: ImportRow[] = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No rows found in the file." },
        { status: 400 }
      );
    }
    if (rows.length > 500) {
      return NextResponse.json(
        { error: "Please import at most 500 drivers at a time." },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const firstName = String(row.firstName ?? "").trim();
      const lastName = String(row.lastName ?? "").trim();
      if (!firstName || !lastName) {
        skipped++;
        continue;
      }

      const parseDate = (value?: string) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
      };

      await prisma.driver.create({
        data: {
          userId,
          firstName,
          lastName,
          phone: String(row.phone ?? "").trim(),
          email: String(row.email ?? "").trim(),
          status: "active",
          source: "import",
          cdlNumber: String(row.cdlNumber ?? "").trim(),
          cdlState: String(row.cdlState ?? "").trim(),
          cdlExpiry: parseDate(row.cdlExpiry as string),
          medCardExpiry: parseDate(row.medCardExpiry as string),
          experienceYears:
            row.experienceYears != null && row.experienceYears !== ""
              ? Number(row.experienceYears) || null
              : null,
          onboardingStep: 3,
          applyToken: randomBytes(16).toString("hex"),
        },
      });
      imported++;
    }

    return NextResponse.json({ imported, skipped });
  } catch (error) {
    return handleApiError(error);
  }
}
