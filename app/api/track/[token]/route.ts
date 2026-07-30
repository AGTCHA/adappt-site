import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { STAGE_LABELS, TRACKER_STEPS } from "@/src/lib/recruiting";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;

  const driver = await prisma.driver.findUnique({
    where: { applyToken: token },
    select: {
      firstName: true,
      lastName: true,
      pipelineStage: true,
      onboardingStep: true,
      company: { select: { name: true } },
      documents: {
        select: { type: true, reviewStatus: true },
      },
    },
  });

  if (!driver) {
    return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  }

  const docTypes = new Set(driver.documents.map((d) => d.type));
  const checklist = [
    { id: "application", label: "Application submitted", done: driver.onboardingStep >= 1 },
    { id: "cdl", label: "CDL on file", done: docTypes.has("cdl") },
    { id: "medcard", label: "Med card on file", done: docTypes.has("medcard") },
    { id: "review", label: "Under review", done: ["review", "onboarding", "hired"].includes(driver.pipelineStage) },
    { id: "hired", label: "Hired", done: driver.pipelineStage === "hired" },
  ];

  const currentStep = TRACKER_STEPS.findIndex((s) => s.id === driver.pipelineStage);
  const stageLabel = STAGE_LABELS[driver.pipelineStage] ?? driver.pipelineStage;

  return NextResponse.json({
    firstName: driver.firstName,
    lastName: driver.lastName,
    companyName: driver.company.name,
    pipelineStage: driver.pipelineStage,
    stageLabel,
    steps: TRACKER_STEPS,
    currentStepIndex: currentStep >= 0 ? currentStep : 0,
    checklist,
    terminal: ["denied", "archived"].includes(driver.pipelineStage),
  });
}
