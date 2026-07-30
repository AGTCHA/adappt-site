/**
 * Recruiting ATS — pipeline stages, dispositions, helpers.
 */

export const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", tone: "accent", column: "active" },
  { id: "application", label: "Application", tone: "accent", column: "active" },
  { id: "documents", label: "Documents", tone: "warning", column: "active" },
  { id: "review", label: "Review", tone: "violet", column: "active" },
  { id: "onboarding", label: "Onboarding", tone: "warning", column: "active" },
  { id: "hired", label: "Hired", tone: "success", column: "active" },
  { id: "hold", label: "Hold", tone: "neutral", column: "hold" },
  { id: "denied", label: "Denied", tone: "danger", column: "terminal" },
  { id: "archived", label: "Archived", tone: "neutral", column: "terminal" },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];
export type PipelineStageTone = (typeof PIPELINE_STAGES)[number]["tone"];

export const ACTIVE_PIPELINE_STAGES = PIPELINE_STAGES.filter((s) => s.column === "active");
export const HOLD_PIPELINE_STAGE = PIPELINE_STAGES.find((s) => s.id === "hold")!;
export const TERMINAL_PIPELINE_STAGES = PIPELINE_STAGES.filter((s) => s.column === "terminal");

export const VALID_STAGE_IDS = new Set(PIPELINE_STAGES.map((s) => s.id));

export const LEAD_DISPOSITIONS = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "no_answer", label: "No answer" },
  { id: "interested", label: "Interested" },
  { id: "not_interested", label: "Not interested" },
  { id: "doesnt_qualify", label: "Doesn't qualify" },
  { id: "converted", label: "Converted" },
] as const;

export type LeadDispositionId = (typeof LEAD_DISPOSITIONS)[number]["id"];

export const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.id, s.label])
);

/** Public progress tracker steps */
export const TRACKER_STEPS = [
  { id: "lead", label: "Application received" },
  { id: "application", label: "Application in progress" },
  { id: "documents", label: "Documents on file" },
  { id: "review", label: "Under review" },
  { id: "onboarding", label: "Onboarding scheduled" },
  { id: "hired", label: "Hired" },
] as const;

export function stageIndex(stage: string): number {
  return TRACKER_STEPS.findIndex((s) => s.id === stage);
}

export function statusForStage(stage: PipelineStageId): string {
  if (stage === "hired") return "active";
  if (stage === "denied" || stage === "archived") return "inactive";
  return "applicant";
}

export interface EmployerRow {
  name: string;
  position?: string;
  from?: string;
  to?: string;
  phone?: string;
}

export function parseEmployers(json: string): EmployerRow[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function logDriverActivity(
  prisma: {
    driverNote: {
      create: (args: {
        data: {
          driverId: string;
          body: string;
          kind: string;
          userId: string;
          userName: string;
        };
      }) => Promise<unknown>;
    };
  },
  params: {
    driverId: string;
    body: string;
    kind?: string;
    userId?: string;
    userName?: string;
  }
) {
  await prisma.driverNote.create({
    data: {
      driverId: params.driverId,
      body: params.body,
      kind: params.kind ?? "note",
      userId: params.userId ?? "",
      userName: params.userName ?? "System",
    },
  });
}
