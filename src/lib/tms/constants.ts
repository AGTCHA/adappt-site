export const LOAD_STATUSES = [
  "pending",
  "assigned",
  "in_transit",
  "delivered",
  "cancelled",
] as const;
export type LoadStatus = (typeof LOAD_STATUSES)[number];

/** Map legacy Adapt statuses into Forge-parity statuses */
export function normalizeLoadStatus(status: string): LoadStatus {
  if (status === "draft") return "pending";
  if (status === "dispatched") return "assigned";
  if ((LOAD_STATUSES as readonly string[]).includes(status)) {
    return status as LoadStatus;
  }
  return "pending";
}

export const LOAD_STATUS_LABEL: Record<LoadStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const LOAD_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["in_transit", "pending", "cancelled"],
  in_transit: ["delivered", "assigned"],
  delivered: ["in_transit"],
  cancelled: ["pending"],
};

export const EQUIPMENT_TYPES = [
  "dry_van",
  "reefer",
  "flatbed",
  "step_deck",
  "tanker",
  "other",
] as const;

export const EQUIPMENT_LABEL: Record<(typeof EQUIPMENT_TYPES)[number], string> = {
  dry_van: "Dry Van",
  reefer: "Reefer",
  flatbed: "Flatbed",
  step_deck: "Step Deck",
  tanker: "Tanker",
  other: "Other",
};

export const STOP_TYPES = ["pickup", "delivery", "stop"] as const;

export const INVOICE_STATUSES = [
  "pending",
  "invoiced",
  "partial",
  "paid",
  "disputed",
  "voided",
] as const;

export const SETTLEMENT_STATUSES = ["draft", "approved", "paid"] as const;

export const PAY_RULE_TYPES = [
  "per_mile",
  "per_load_pct",
  "hourly",
  "flat_per_load",
  "salary_weekly",
  "team_split",
] as const;

export const PAY_RULE_LABEL: Record<(typeof PAY_RULE_TYPES)[number], string> = {
  per_mile: "Per Mile",
  per_load_pct: "% of Linehaul",
  hourly: "Hourly",
  flat_per_load: "Flat per Load",
  salary_weekly: "Weekly Salary",
  team_split: "Team Split",
};

export const DOC_TYPES = [
  "bol",
  "pod",
  "rate_confirmation",
  "invoice",
  "signed_rate_con",
  "lumper_receipt",
  "scale_ticket",
  "other",
] as const;

export const DOC_TYPE_LABEL: Record<(typeof DOC_TYPES)[number], string> = {
  bol: "BOL",
  pod: "POD",
  rate_confirmation: "Rate Con",
  invoice: "Invoice",
  signed_rate_con: "Signed Rate Con",
  lumper_receipt: "Lumper",
  scale_ticket: "Scale Ticket",
  other: "Other",
};

export const LOADBOARD_PROVIDERS = [
  "dat",
  "truckstop",
  "123loadboard",
  "amazon_relay",
  "uber_freight",
] as const;

export const LOADBOARD_LABEL: Record<(typeof LOADBOARD_PROVIDERS)[number], string> = {
  dat: "DAT",
  truckstop: "Truckstop",
  "123loadboard": "123Loadboard",
  amazon_relay: "Amazon Relay",
  uber_freight: "Uber Freight",
};

export const AGING_BUCKETS = ["current", "1_30", "31_60", "61_90", "90_plus"] as const;

export function agingBucketFor(dueDate: Date | null | undefined, now = new Date()): string {
  if (!dueDate) return "current";
  const days = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "current";
  if (days <= 30) return "1_30";
  if (days <= 60) return "31_60";
  if (days <= 90) return "61_90";
  return "90_plus";
}
