import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";

const STEPS = [
  "identity",
  "telematics",
  "fleet",
  "customer",
  "edi",
  "pay",
  "team",
  "done",
] as const;

function stepIndex(step: string): number {
  const idx = STEPS.indexOf(step as (typeof STEPS)[number]);
  return idx === -1 ? 0 : idx;
}

export async function GET() {
  try {
    const { companyId } = await requireModule("tms");

    let settings = await prisma.tmsCompanySettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await prisma.tmsCompanySettings.create({
        data: { companyId },
      });
    }

    return NextResponse.json({
      currentStep: settings.onboardingStep,
      steps: STEPS,
      currentStepIndex: stepIndex(settings.onboardingStep),
      totalSteps: STEPS.length,
      onboardingComplete: settings.onboardingComplete,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const action = String(body.action ?? "").trim();
    if (action !== "complete" && action !== "skip") {
      return NextResponse.json(
        { error: "action must be 'complete' or 'skip'." },
        { status: 400 }
      );
    }

    const step = String(body.step ?? "").trim();

    let settings = await prisma.tmsCompanySettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await prisma.tmsCompanySettings.create({
        data: { companyId },
      });
    }

    if (step && step !== settings.onboardingStep) {
      return NextResponse.json(
        { error: `Current step is '${settings.onboardingStep}', not '${step}'.` },
        { status: 409 }
      );
    }

    const currentIdx = stepIndex(settings.onboardingStep);
    const nextIdx = currentIdx + 1;

    if (nextIdx >= STEPS.length) {
      const updated = await prisma.tmsCompanySettings.update({
        where: { companyId },
        data: { onboardingStep: "done", onboardingComplete: true },
      });
      return NextResponse.json({
        currentStep: updated.onboardingStep,
        onboardingComplete: updated.onboardingComplete,
      });
    }

    const nextStep = STEPS[nextIdx];
    const isDone = nextStep === "done";

    const updated = await prisma.tmsCompanySettings.update({
      where: { companyId },
      data: {
        onboardingStep: nextStep,
        onboardingComplete: isDone,
      },
    });

    return NextResponse.json({
      currentStep: updated.onboardingStep,
      onboardingComplete: updated.onboardingComplete,
      stepsRemaining: STEPS.length - 1 - stepIndex(nextStep),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
