import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const lead = await prisma.lead.findFirst({ where: { id, userId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    // Convert a lead into a driver applicant
    if (body.action === "convert") {
      const [firstName, ...rest] = (lead.name || "New Applicant").split(" ");
      const driver = await prisma.driver.create({
        data: {
          userId,
          firstName: firstName || "New",
          lastName: rest.join(" ") || "Applicant",
          phone: lead.phone,
          email: lead.email,
          status: "applicant",
          source: "job_ad",
          onboardingStep: 0,
          applyToken: randomBytes(16).toString("hex"),
        },
      });
      await prisma.lead.update({ where: { id }, data: { status: "converted" } });
      return NextResponse.json({ driver });
    }

    if (["new", "contacted", "converted", "dismissed"].includes(body.status)) {
      const updated = await prisma.lead.update({
        where: { id },
        data: { status: body.status },
      });
      return NextResponse.json({ lead: updated });
    }

    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
