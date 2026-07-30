/**
 * Recruiting analytics — shared computations for dashboard & analytics APIs.
 */
import { STAGE_LABELS } from "./recruiting";

export const DASHBOARD_FUNNEL_STAGES = [
  { id: "lead", shortLabel: "Lead", tone: "accent" as const },
  { id: "application", shortLabel: "Application", tone: "accent" as const },
  { id: "documents", shortLabel: "Documents", tone: "warning" as const },
  { id: "review", shortLabel: "Review", tone: "violet" as const },
  { id: "onboarding", shortLabel: "Onboarding", tone: "warning" as const },
  { id: "hired", shortLabel: "Hired", tone: "success" as const },
];

export const ACTIVE_STAGE_IDS = new Set([
  "lead",
  "application",
  "documents",
  "review",
  "onboarding",
  "hold",
]);

const MS_DAY = 86_400_000;

export function daysBetween(from: Date, to: Date = new Date()) {
  return Math.max(0, (to.getTime() - from.getTime()) / MS_DAY);
}

export function normalizeDriverType(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v.includes("owner") || v === "oo") return "Owner Operator";
  if (v.includes("lease")) return "Lease Purchase";
  if (v.includes("company")) return "Company Driver";
  if (!v) return "Unknown";
  return raw.trim();
}

export function normalizeRouteDivision(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v === "local") return "Local";
  if (v === "regional") return "Regional";
  if (v === "otr") return "OTR";
  if (!v) return "Unknown";
  return raw.trim();
}

export function hireSourceKey(raw: string | null | undefined) {
  const s = raw?.trim();
  return s && s !== "manual" && s !== "import" ? s : "Not specified";
}

export interface DriverAnalyticsRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  pipelineStage: string;
  status: string;
  source: string;
  hireSource: string;
  driverType: string;
  preferredRoute: string;
  createdAt: Date;
  updatedAt: Date;
  followUpAt: Date | null;
  archivedAt: Date | null;
  terminalKind: string;
  terminalReason: string;
}

export function stageCounts(drivers: DriverAnalyticsRow[]) {
  const map: Record<string, number> = {};
  for (const d of drivers) {
    if (["denied", "archived"].includes(d.pipelineStage)) continue;
    map[d.pipelineStage] = (map[d.pipelineStage] ?? 0) + 1;
  }
  return map;
}

export function dashboardKpis(counts: Record<string, number>) {
  return {
    active:
      (counts.lead ?? 0) + (counts.application ?? 0) + (counts.documents ?? 0),
    review: counts.review ?? 0,
    onboarding: counts.onboarding ?? 0,
    hired: counts.hired ?? 0,
    hold: counts.hold ?? 0,
  };
}

export function funnelFromCounts(counts: Record<string, number>) {
  return DASHBOARD_FUNNEL_STAGES.map((s) => ({
    stage: s.id,
    label: STAGE_LABELS[s.id] ?? s.shortLabel,
    shortLabel: s.shortLabel,
    count: counts[s.id] ?? 0,
    tone: s.tone,
  }));
}

export type VelocityKind = "fast" | "normal" | "slow";

export function computeVelocity(driver: DriverAnalyticsRow): {
  daysInPipeline: number;
  daysInStage: number;
  totalDays: number;
  velocity: VelocityKind;
} {
  const now = new Date();
  const daysInPipeline = daysBetween(driver.createdAt, now);
  const daysInStage = daysBetween(driver.updatedAt, now);

  let totalDays = daysInPipeline;
  if (driver.pipelineStage === "hired") {
    totalDays = daysBetween(driver.createdAt, driver.updatedAt);
  }

  let velocity: VelocityKind = "normal";
  if (driver.pipelineStage === "hired" && totalDays <= 7) velocity = "fast";
  else if (
    ACTIVE_STAGE_IDS.has(driver.pipelineStage) &&
    driver.pipelineStage !== "hold" &&
    daysInStage >= 6
  ) {
    velocity = "slow";
  }

  return {
    daysInPipeline: Math.round(daysInPipeline * 10) / 10,
    daysInStage: Math.round(daysInStage * 10) / 10,
    totalDays: Math.round(totalDays * 10) / 10,
    velocity,
  };
}

export function pipelineVelocity(drivers: DriverAnalyticsRow[]) {
  const cutoff = Date.now() - 90 * MS_DAY;
  return drivers
    .filter(
      (d) =>
        d.createdAt.getTime() >= cutoff &&
        !["denied", "archived"].includes(d.pipelineStage) &&
        d.source !== "import"
    )
    .map((d) => {
      const v = computeVelocity(d);
      return {
        id: d.id,
        name: `${d.firstName} ${d.lastName}`.trim(),
        stage: d.pipelineStage,
        stageLabel: STAGE_LABELS[d.pipelineStage] ?? d.pipelineStage,
        hireSource: hireSourceKey(d.hireSource),
        driverType: normalizeDriverType(d.driverType),
        division: normalizeRouteDivision(d.preferredRoute),
        phone: d.phone,
        ...v,
      };
    })
    .sort((a, b) => a.totalDays - b.totalDays)
    .slice(0, 50);
}

export function topHireSources(
  drivers: DriverAnalyticsRow[],
  limit = 5
): { source: string; count: number; drivers: { id: string; name: string; phone: string }[] }[] {
  const map = new Map<string, { count: number; drivers: { id: string; name: string; phone: string }[] }>();
  for (const d of drivers.filter((x) => x.pipelineStage === "hired")) {
    const key = hireSourceKey(d.hireSource);
    const entry = map.get(key) ?? { count: 0, drivers: [] };
    entry.count++;
    if (entry.drivers.length < 8) {
      entry.drivers.push({
        id: d.id,
        name: `${d.firstName} ${d.lastName}`.trim(),
        phone: d.phone,
      });
    }
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([source, v]) => ({ source, count: v.count, drivers: v.drivers }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function hireSourceStats(drivers: DriverAnalyticsRow[]) {
  const map = new Map<string, number>();
  for (const d of drivers.filter((x) => x.pipelineStage === "hired")) {
    const key = hireSourceKey(d.hireSource);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export function monthlyHiresBySource(drivers: DriverAnalyticsRow[]) {
  const map = new Map<string, Record<string, number>>();
  for (const d of drivers.filter((x) => x.pipelineStage === "hired")) {
    const month = d.updatedAt.toISOString().slice(0, 7);
    const source = hireSourceKey(d.hireSource);
    const row = map.get(month) ?? {};
    row[source] = (row[source] ?? 0) + 1;
    map.set(month, row);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, sources]) => ({
      month,
      sources,
      total: Object.values(sources).reduce((s, n) => s + n, 0),
    }));
}

export function hireSourceInsights(
  stats: { source: string; count: number }[],
  totalHired: number
) {
  const insights: { type: "success" | "warning" | "info"; text: string }[] = [];
  if (totalHired === 0) {
    insights.push({
      type: "info",
      text: "No hires recorded yet — move drivers to Hired to unlock hire-source insights.",
    });
    return insights;
  }
  const top = stats[0];
  if (top) {
    const pct = Math.round((top.count / totalHired) * 100);
    insights.push({
      type: "success",
      text: `${top.source} is your top channel with ${top.count} hire${top.count === 1 ? "" : "s"} (${pct}% of hires).`,
    });
  }
  const unknown = stats.find((s) => s.source === "Not specified");
  if (unknown && unknown.count / totalHired > 0.25) {
    insights.push({
      type: "warning",
      text: `${Math.round((unknown.count / totalHired) * 100)}% of hires lack a hire source — set sources on driver profiles.`,
    });
  }
  if (stats.length >= 3) {
    const topThree = stats.slice(0, 3).reduce((s, x) => s + x.count, 0);
    insights.push({
      type: "info",
      text: `Your top 3 sources account for ${Math.round((topThree / totalHired) * 100)}% of all hires.`,
    });
  }
  return insights;
}

type Period = "week" | "month";
type Range = "all" | "3months" | "6months" | "12months";

function rangeCutoff(range: Range) {
  if (range === "all") return null;
  const months = range === "3months" ? 3 : range === "6months" ? 6 : 12;
  return new Date(Date.now() - months * 30 * MS_DAY);
}

function periodKey(date: Date, period: Period) {
  if (period === "month") return date.toISOString().slice(0, 7);
  const d = new Date(date);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function driverTypeTrends(
  drivers: DriverAnalyticsRow[],
  period: Period = "week",
  range: Range = "all"
) {
  const cutoff = rangeCutoff(range);
  const buckets = new Map<string, Record<string, number | string>>();

  for (const d of drivers) {
    if (d.pipelineStage !== "hired" && d.pipelineStage !== "onboarding") continue;
    const date = d.pipelineStage === "hired" ? d.updatedAt : d.createdAt;
    if (cutoff && date < cutoff) continue;
    const key = periodKey(date, period);
    const label = normalizeDriverType(d.driverType);
    const row = buckets.get(key) ?? {
      period: key,
      "Owner Operator": 0,
      "Lease Purchase": 0,
      "Company Driver": 0,
      Unknown: 0,
      total: 0,
    };
    const field = label in row ? label : "Unknown";
    row[field] = (row[field] as number) + 1;
    row.total = (row.total as number) + 1;
    buckets.set(key, row);
  }

  return [...buckets.values()].sort((a, b) =>
    String(a.period).localeCompare(String(b.period))
  );
}

export function divisionTrends(
  drivers: DriverAnalyticsRow[],
  period: Period = "week",
  range: Range = "all"
) {
  const cutoff = rangeCutoff(range);
  const buckets = new Map<string, Record<string, number | string>>();

  for (const d of drivers) {
    if (d.pipelineStage !== "hired" && d.pipelineStage !== "onboarding") continue;
    const date = d.pipelineStage === "hired" ? d.updatedAt : d.createdAt;
    if (cutoff && date < cutoff) continue;
    const label = normalizeRouteDivision(d.preferredRoute);
    if (label === "Unknown") continue;
    const key = periodKey(date, period);
    const row = buckets.get(key) ?? { period: key, Local: 0, Regional: 0, OTR: 0, total: 0 };
    row[label] = (row[label] as number) + 1;
    row.total = (row.total as number) + 1;
    buckets.set(key, row);
  }

  return [...buckets.values()].sort((a, b) =>
    String(a.period).localeCompare(String(b.period))
  );
}

export interface PerformanceDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  driverType: string;
  division: string;
  pipelineStage: string;
  status: string;
  hireSource: string;
  createdAt: string;
  hiredAt: string | null;
  leftAt: string | null;
  terminalReason: string;
  isActive: boolean;
  isLeft: boolean;
}

export function buildPerformanceList(drivers: DriverAnalyticsRow[]): PerformanceDriver[] {
  return drivers
    .filter(
      (d) =>
        d.pipelineStage === "hired" ||
        (d.status === "inactive" &&
          (d.pipelineStage === "archived" || d.pipelineStage === "hired"))
    )
    .map((d) => {
      const isLeft =
        d.status === "inactive" ||
        d.pipelineStage === "archived" ||
        Boolean(d.archivedAt);
      const isActive = d.pipelineStage === "hired" && d.status === "active" && !isLeft;
      return {
        id: d.id,
        name: `${d.firstName} ${d.lastName}`.trim(),
        phone: d.phone,
        email: d.email,
        driverType: normalizeDriverType(d.driverType),
        division: normalizeRouteDivision(d.preferredRoute),
        pipelineStage: d.pipelineStage,
        status: d.status,
        hireSource: hireSourceKey(d.hireSource),
        createdAt: d.createdAt.toISOString(),
        hiredAt: d.pipelineStage === "hired" ? d.updatedAt.toISOString() : null,
        leftAt: d.archivedAt?.toISOString() ?? null,
        terminalReason: d.terminalReason,
        isActive,
        isLeft,
      };
    });
}

export function buildPerformanceSummary(drivers: DriverAnalyticsRow[]) {
  const list = buildPerformanceList(drivers);
  const hired = list.filter((d) => d.hiredAt);
  const stillActive = hired.filter((d) => d.isActive && !d.isLeft);
  const left = hired.filter((d) => d.isLeft);
  const retentionRate = hired.length > 0 ? (stillActive.length / hired.length) * 100 : 0;

  const bySource = new Map<string, { hired: number; active: number; left: number }>();
  for (const d of hired) {
    const row = bySource.get(d.hireSource) ?? { hired: 0, active: 0, left: 0 };
    row.hired++;
    if (d.isActive && !d.isLeft) row.active++;
    if (d.isLeft) row.left++;
    bySource.set(d.hireSource, row);
  }

  const retentionBySource = [...bySource.entries()]
    .map(([source, v]) => ({
      source,
      hired: v.hired,
      active: v.active,
      left: v.left,
      retention: v.hired > 0 ? Math.round((v.active / v.hired) * 100) : 0,
    }))
    .sort((a, b) => b.hired - a.hired);

  const weekMap = new Map<string, number>();
  for (const d of hired) {
    if (!d.hiredAt) continue;
    const weekStart = periodKey(new Date(d.hiredAt), "week");
    weekMap.set(weekStart, (weekMap.get(weekStart) ?? 0) + 1);
  }
  const weeklyData = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-16)
    .map(([week, hires]) => ({
      week,
      hires,
      label: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

  return {
    totalHired: hired.length,
    stillActive: stillActive.length,
    quitLeft: left.length,
    retentionRate,
    retentionBySource,
    weeklyData,
    drivers: hired,
  };
}

export function retentionAnalysis(drivers: DriverAnalyticsRow[]) {
  const active = drivers.filter((d) => d.status === "active");
  const churned = drivers.filter(
    (d) =>
      d.status === "inactive" &&
      (d.pipelineStage === "hired" || d.pipelineStage === "archived" || d.archivedAt)
  );

  const byType = new Map<string, { active: number; churned: number }>();
  for (const d of [...active, ...churned]) {
    const t = normalizeDriverType(d.driverType);
    const row = byType.get(t) ?? { active: 0, churned: 0 };
    if (d.status === "active") row.active++;
    else row.churned++;
    byType.set(t, row);
  }

  const avgTenureActive =
    active.length > 0
      ? active.reduce((s, d) => s + daysBetween(d.createdAt), 0) / active.length
      : 0;

  return {
    activeCount: active.length,
    churnedCount: churned.length,
    retentionRate:
      active.length + churned.length > 0
        ? Math.round((active.length / (active.length + churned.length)) * 100)
        : 0,
    avgTenureDays: Math.round(avgTenureActive),
    byDriverType: [...byType.entries()].map(([type, v]) => ({
      type,
      active: v.active,
      churned: v.churned,
      retention:
        v.active + v.churned > 0
          ? Math.round((v.active / (v.active + v.churned)) * 100)
          : 0,
    })),
    recentChurn: churned
      .sort((a, b) => (b.archivedAt?.getTime() ?? 0) - (a.archivedAt?.getTime() ?? 0))
      .slice(0, 8)
      .map((d) => ({
        id: d.id,
        name: `${d.firstName} ${d.lastName}`.trim(),
        reason: d.terminalReason || "Inactive",
        leftAt: d.archivedAt?.toISOString() ?? null,
        hireSource: hireSourceKey(d.hireSource),
      })),
  };
}

export async function fetchDriverAnalyticsRows(
  prisma: {
    driver: {
      findMany: (args: object) => Promise<DriverAnalyticsRow[]>;
    };
  },
  companyId: string
) {
  return prisma.driver.findMany({
    where: { companyId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      pipelineStage: true,
      status: true,
      source: true,
      hireSource: true,
      driverType: true,
      preferredRoute: true,
      createdAt: true,
      updatedAt: true,
      followUpAt: true,
      archivedAt: true,
      terminalKind: true,
      terminalReason: true,
    },
  });
}
