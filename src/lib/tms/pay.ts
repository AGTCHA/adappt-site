import type { TmsDriverPayRule } from "@/app/generated/prisma";

export type LoadPayInput = {
  linehaulRevenue: number;
  fuelSurcharge: number;
  loadedMiles: number;
  emptyMiles: number;
  stopCount: number;
};

export function computeLoadDriverPay(
  rule: Pick<
    TmsDriverPayRule,
    | "ruleType"
    | "ratePerMile"
    | "ratePerMileEmpty"
    | "ratePerLoadPct"
    | "rateFlat"
    | "rateHourly"
    | "salaryWeekly"
    | "teamSharePct"
    | "stopPay"
  > | null,
  load: LoadPayInput,
): number {
  if (!rule) {
    return Math.round(load.loadedMiles * 0.55 * 100) / 100;
  }

  switch (rule.ruleType) {
    case "per_mile": {
      const loaded = (rule.ratePerMile ?? 0) * load.loadedMiles;
      const empty = (rule.ratePerMileEmpty ?? rule.ratePerMile ?? 0) * load.emptyMiles;
      const stops = Math.max(0, load.stopCount - 2) * (rule.stopPay ?? 0);
      return round2(loaded + empty + stops);
    }
    case "per_load_pct":
      return round2(((rule.ratePerLoadPct ?? 0) / 100) * load.linehaulRevenue);
    case "flat_per_load":
      return round2(rule.rateFlat ?? 0);
    case "hourly":
      return round2((rule.rateHourly ?? 0) * Math.max(1, load.loadedMiles / 50));
    case "salary_weekly":
      return 0;
    case "team_split":
      return round2(
        ((rule.teamSharePct ?? 50) / 100) *
          ((rule.ratePerMile ?? 0.55) * load.loadedMiles),
      );
    default:
      return round2(load.loadedMiles * 0.55);
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
