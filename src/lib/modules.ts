/**
 * Adapt platform modules — gated per Company.enabledModules (comma-separated).
 */
export {
  PIPELINE_STAGES,
  ACTIVE_PIPELINE_STAGES,
  HOLD_PIPELINE_STAGE,
  TERMINAL_PIPELINE_STAGES,
  VALID_STAGE_IDS,
  LEAD_DISPOSITIONS,
  STAGE_LABELS,
  TRACKER_STEPS,
  type PipelineStageId,
  type PipelineStageTone,
  type LeadDispositionId,
} from "./recruiting";

export const MODULES = {
  recruiting: {
    id: "recruiting",
    label: "Recruiting",
    description: "Pipeline, drivers, leads, job ads",
    defaultEnabled: true,
  },
  fleet: {
    id: "fleet",
    label: "Maintenance",
    description: "Units, work orders, PM, vendors, invoices",
    defaultEnabled: true,
  },
  tms: {
    id: "tms",
    label: "TMS",
    description: "Loads, dispatch, settlements, EDI, load boards",
    defaultEnabled: true,
  },
  dispatch: {
    id: "dispatch",
    label: "Dispatch",
    description: "Driver roster & assignments",
    defaultEnabled: false,
  },
  crm: {
    id: "crm",
    label: "CRM",
    description: "Customers & sales pipeline",
    defaultEnabled: false,
  },
  office: {
    id: "office",
    label: "Office",
    description: "HR, PTO, directory",
    defaultEnabled: false,
  },
  portal: {
    id: "portal",
    label: "Driver Portal",
    description: "Driver self-service",
    defaultEnabled: false,
  },
} as const;

export type ModuleId = keyof typeof MODULES;

export const ALL_MODULE_IDS = Object.keys(MODULES) as ModuleId[];

export const DEFAULT_ENABLED_MODULES: ModuleId[] = ["recruiting", "fleet", "tms"];

export function parseEnabledModules(raw: string | null | undefined): ModuleId[] {
  if (!raw?.trim()) return [...DEFAULT_ENABLED_MODULES];
  const parsed = raw
    .split(",")
    .map((s) => s.trim())
    .filter((id): id is ModuleId => id in MODULES);
  return parsed.length > 0 ? parsed : [...DEFAULT_ENABLED_MODULES];
}

export function serializeEnabledModules(modules: ModuleId[]): string {
  return modules.join(",");
}

export function slugifyCompanyName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "company";
}

export const MODULE_NAV: Record<
  ModuleId,
  { href: string; label: string; icon: string }[]
> = {
  recruiting: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/drivers/pipeline", label: "Pipeline", icon: "Kanban" },
    { href: "/drivers", label: "Drivers", icon: "Users" },
    { href: "/leads", label: "Leads", icon: "Inbox" },
    { href: "/job-ads", label: "Job Ads", icon: "Megaphone" },
    { href: "/recruiting/hire-sources", label: "Hire Sources", icon: "Target" },
    { href: "/recruiting/analytics", label: "Analytics", icon: "BarChart3" },
    { href: "/recruiting/performance", label: "Performance", icon: "Target" },
    { href: "/messages", label: "Messages", icon: "MessageSquare" },
  ],
  fleet: [
    { href: "/maintenance", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/maintenance/units", label: "Units", icon: "Truck" },
    { href: "/maintenance/work-orders", label: "Work Orders", icon: "Wrench" },
    { href: "/maintenance/documents", label: "Documents", icon: "FileText" },
    { href: "/maintenance/service", label: "Service / PM", icon: "Calendar" },
    { href: "/maintenance/vendors", label: "Vendors", icon: "Store" },
    { href: "/maintenance/history", label: "History", icon: "History" },
    { href: "/maintenance/reports", label: "Reports", icon: "BarChart3" },
  ],
  tms: [
    { href: "/tms", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/tms/messages", label: "Mailbox", icon: "Mail" },
    { href: "/tms/loads", label: "Loads", icon: "Package" },
    { href: "/tms/load-board", label: "Load Board", icon: "Search" },
    { href: "/tms/planning", label: "Planning", icon: "Calendar" },
    { href: "/tms/dispatch", label: "Dispatch", icon: "Radio" },
    { href: "/tms/nudge", label: "HOS Nudge", icon: "BellRing" },
    { href: "/tms/fleet", label: "Fleet Map", icon: "Map" },
    { href: "/tms/drivers", label: "Drivers", icon: "Users" },
    { href: "/tms/safety", label: "Safety", icon: "Shield" },
    { href: "/tms/customers", label: "Customers", icon: "Building2" },
    { href: "/tms/invoices", label: "Invoices", icon: "FileText" },
    { href: "/tms/settlements", label: "Settlements", icon: "Banknote" },
    { href: "/tms/pay-rules", label: "Pay Rules", icon: "Percent" },
    { href: "/tms/analytics", label: "Analytics", icon: "BarChart3" },
    { href: "/tms/edi", label: "EDI", icon: "Network" },
    { href: "/tms/highway", label: "Highway", icon: "ShieldCheck" },
    { href: "/tms/settings", label: "TMS Settings", icon: "Settings" },
  ],
  dispatch: [{ href: "/dispatch", label: "Roster", icon: "Radio" }],
  crm: [
    { href: "/crm", label: "Pipeline", icon: "Target" },
    { href: "/crm/customers", label: "Customers", icon: "Building2" },
  ],
  office: [
    { href: "/office", label: "Directory", icon: "Users" },
    { href: "/office/pto", label: "PTO", icon: "Calendar" },
  ],
  portal: [{ href: "/portal", label: "Driver Portal", icon: "Smartphone" }],
};

export const SHARED_NAV = [{ href: "/support", label: "Support", icon: "LifeBuoy" }];
