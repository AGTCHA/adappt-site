import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { LEAD_DISPOSITIONS, logDriverActivity } from "@/src/lib/recruiting";

type Params = { params: Promise<{ id: string }> };

const VALID_DISPOSITIONS = new Set(LEAD_DISPOSITIONS.map((d) => d.id));

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { companyId } = await requireModule("recruiting");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const lead = await prisma.lead.findFirst({
      where: { id, companyId },
      include: { jobAd: { select: { title: true } } },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    if (body.action === "convert") {
      const [firstName, ...rest] = (lead.name || "New Applicant").split(" ");
      const hireSource = String(body.hireSource ?? lead.jobAd.title ?? "Job Ad").trim();
      const driver = await prisma.driver.create({
        data: {
          companyId,
          firstName: firstName || "New",
          lastName: rest.join(" ") || "Applicant",
          phone: lead.phone,
          email: lead.email,
          status: "applicant",
          pipelineStage: "lead",
          source: "job_ad",
          hireSource,
          onboardingStep: 0,
          applyToken: randomBytes(16).toString("hex"),
        },
      });

      await logDriverActivity(prisma, {
        driverId: driver.id,
        body: `Converted from lead (${lead.jobAd.title})`,
        kind: "system",
      });

      const updated = await prisma.lead.update({
        where: { id },
        data: {
          status: "converted",
          disposition: "converted",
          convertedDriverId: driver.id,
        },
      });
      return NextResponse.json({ driver, lead: updated });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.disposition === "string" && VALID_DISPOSITIONS.has(body.disposition)) {
      data.disposition = body.disposition;
      data.status = body.disposition === "converted" ? "converted" : body.disposition;
    }
    if (typeof body.dispositionNote === "string") {
      data.dispositionNote = body.dispositionNote.trim();
    }
    if ("followUpAt" in body) {
      data.followUpAt =
        body.followUpAt === null || body.followUpAt === ""
          ? null
          : new Date(body.followUpAt);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await prisma.lead.update({ where: { id }, data });
    return NextResponse.json({ lead: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
