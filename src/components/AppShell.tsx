"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Truck,
  Megaphone,
  MessageSquare,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  Kanban,
  Wrench,
  Store,
  Package,
  Radio,
  Target,
  Building2,
  Calendar,
  Smartphone,
  ChevronDown,
  Settings,
  CreditCard,
  UserPlus,
  FileText,
  History,
  BarChart3,
  Inbox,
  Mail,
  Search,
  Map,
  Banknote,
  Percent,
  Network,
  ShieldCheck,
  Rocket,
  BellRing,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { api } from "@/src/lib/client";
import type { ModuleId } from "@/src/lib/modules";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Truck,
  Megaphone,
  MessageSquare,
  LifeBuoy,
  Kanban,
  Wrench,
  Store,
  Package,
  Radio,
  Target,
  Building2,
  Calendar,
  Smartphone,
  Settings,
  CreditCard,
  UserPlus,
  FileText,
  History,
  BarChart3,
  Inbox,
  Mail,
  Search,
  Map,
  Banknote,
  Percent,
  Network,
  ShieldCheck,
  Rocket,
  BellRing,
  Shield,
};

type NavItem = { href: string; label: string; icon: string; module?: ModuleId };

const MODULE_NAV: Record<ModuleId, NavItem[]> = {
  recruiting: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", module: "recruiting" },
    { href: "/drivers/pipeline", label: "Pipeline", icon: "Kanban", module: "recruiting" },
    { href: "/drivers", label: "Drivers", icon: "Users", module: "recruiting" },
    { href: "/leads", label: "Leads", icon: "Inbox", module: "recruiting" },
    { href: "/job-ads", label: "Job Ads", icon: "Megaphone", module: "recruiting" },
    { href: "/recruiting/hire-sources", label: "Hire Sources", icon: "Target", module: "recruiting" },
    { href: "/recruiting/analytics", label: "Analytics", icon: "BarChart3", module: "recruiting" },
    { href: "/recruiting/performance", label: "Performance", icon: "Target", module: "recruiting" },
    { href: "/messages", label: "Messages", icon: "MessageSquare", module: "recruiting" },
  ],
  fleet: [
    { href: "/maintenance", label: "Dashboard", icon: "LayoutDashboard", module: "fleet" },
    { href: "/maintenance/units", label: "Units", icon: "Truck", module: "fleet" },
    { href: "/maintenance/work-orders", label: "Work Orders", icon: "Wrench", module: "fleet" },
    { href: "/maintenance/documents", label: "Documents", icon: "FileText", module: "fleet" },
    { href: "/maintenance/service", label: "Service / PM", icon: "Calendar", module: "fleet" },
    { href: "/maintenance/vendors", label: "Vendors", icon: "Store", module: "fleet" },
    { href: "/maintenance/history", label: "History", icon: "History", module: "fleet" },
    { href: "/maintenance/reports", label: "Reports", icon: "BarChart3", module: "fleet" },
  ],
  tms: [
    { href: "/tms", label: "Dashboard", icon: "LayoutDashboard", module: "tms" },
    { href: "/tms/messages", label: "Mailbox", icon: "Mail", module: "tms" },
    { href: "/tms/loads", label: "Loads", icon: "Package", module: "tms" },
    { href: "/tms/load-board", label: "Load Board", icon: "Search", module: "tms" },
    { href: "/tms/planning", label: "Planning", icon: "Calendar", module: "tms" },
    { href: "/tms/dispatch", label: "Dispatch", icon: "Radio", module: "tms" },
    { href: "/tms/nudge", label: "HOS Nudge", icon: "BellRing", module: "tms" },
    { href: "/tms/fleet", label: "Fleet Map", icon: "Map", module: "tms" },
    { href: "/tms/drivers", label: "Drivers", icon: "Users", module: "tms" },
    { href: "/tms/safety", label: "Safety", icon: "Shield", module: "tms" },
    { href: "/tms/customers", label: "Customers", icon: "Building2", module: "tms" },
    { href: "/tms/invoices", label: "Invoices", icon: "FileText", module: "tms" },
    { href: "/tms/settlements", label: "Settlements", icon: "Banknote", module: "tms" },
    { href: "/tms/pay-rules", label: "Pay Rules", icon: "Percent", module: "tms" },
    { href: "/tms/analytics", label: "Analytics", icon: "BarChart3", module: "tms" },
    { href: "/tms/edi", label: "EDI", icon: "Network", module: "tms" },
    { href: "/tms/highway", label: "Highway", icon: "ShieldCheck", module: "tms" },
    { href: "/tms/settings", label: "TMS Settings", icon: "Settings", module: "tms" },
    { href: "/tms/onboarding", label: "Onboarding", icon: "Rocket", module: "tms" },
  ],
  dispatch: [{ href: "/dispatch", label: "Roster", icon: "Radio", module: "dispatch" }],
  crm: [
    { href: "/crm", label: "Pipeline", icon: "Target", module: "crm" },
    { href: "/crm/customers", label: "Customers", icon: "Building2", module: "crm" },
  ],
  office: [
    { href: "/office", label: "Directory", icon: "Users", module: "office" },
    { href: "/office/pto", label: "PTO", icon: "Calendar", module: "office" },
  ],
  portal: [{ href: "/portal", label: "Driver Portal", icon: "Smartphone", module: "portal" }],
};

const MODULE_LABELS: Record<ModuleId, string> = {
  recruiting: "Recruiting",
  fleet: "Maintenance",
  tms: "TMS",
  dispatch: "Dispatch",
  crm: "CRM",
  office: "Office",
  portal: "Driver Portal",
};

const MODULE_DOT: Record<ModuleId, string> = {
  recruiting: "bg-accent",
  fleet: "bg-warning",
  tms: "bg-violet",
  dispatch: "bg-success",
  crm: "bg-accent",
  office: "bg-violet",
  portal: "bg-success",
};

const ADMIN_NAV: NavItem[] = [
  { href: "/settings/team", label: "Team & invites", icon: "UserPlus" },
  { href: "/settings/integrations", label: "Integrations", icon: "Settings" },
  { href: "/settings/billing", label: "Billing", icon: "CreditCard" },
  { href: "/support", label: "Support", icon: "LifeBuoy" },
];

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const exactOnly =
          item.href === "/dashboard" ||
          item.href === "/maintenance" ||
          item.href === "/tms" ||
          item.href === "/crm" ||
          item.href === "/office";
        const active =
          pathname === item.href ||
          (!exactOnly && pathname.startsWith(`${item.href}/`));
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`focus-ring relative flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "font-semibold text-accent"
                : "text-ink-secondary hover:bg-accent-soft hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-accent-soft"
              />
            )}
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
            )}
            <Icon size={16} className="relative z-10 shrink-0" />
            <span className="relative z-10 truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ModuleSwitcher({
  activeModule,
  enabledModules,
  onChange,
}: {
  activeModule: ModuleId;
  enabledModules: ModuleId[];
  onChange: (m: ModuleId) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = enabledModules.filter((m) => MODULE_NAV[m]?.length);

  if (options.length <= 1) {
    return (
      <p className="mb-3 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
        <span className={`h-2 w-2 rounded-full ${MODULE_DOT[activeModule]}`} />
        {MODULE_LABELS[activeModule] ?? "Adapt"}
      </p>
    );
  }

  return (
    <div className="relative mb-3 px-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center justify-between rounded-xl border border-border bg-surface-solid px-3 py-2.5 text-left text-sm font-semibold shadow-sm"
      >
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${MODULE_DOT[activeModule]}`} />
          {MODULE_LABELS[activeModule]}
        </span>
        <ChevronDown size={14} className={`text-ink-tertiary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-surface-solid shadow-raised"
          >
            {options.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className={`focus-ring flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent-soft ${
                  m === activeModule ? "font-semibold text-accent" : "text-ink-secondary"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${MODULE_DOT[m]}`} />
                {MODULE_LABELS[m]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({
  user,
  onNavigate,
}: {
  user: {
    name: string;
    companyName: string;
    enabledModules: ModuleId[];
    role: string;
  };
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const initialModule = useMemo(() => {
    for (const mod of user.enabledModules) {
      const items = MODULE_NAV[mod] ?? [];
      if (items.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))) {
        return mod;
      }
    }
    return user.enabledModules[0] ?? "recruiting";
  }, [pathname, user.enabledModules]);

  const [activeModule, setActiveModule] = useState<ModuleId>(initialModule);

  const navItems = useMemo(() => {
    const items = MODULE_NAV[activeModule] ?? [];
    const seen = new Set<string>();
    return [...items, ...ADMIN_NAV].filter((i) => {
      if (seen.has(i.href)) return false;
      seen.add(i.href);
      return true;
    });
  }, [activeModule]);

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col p-4">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2.5 px-2 pt-2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-text shadow-sm shadow-accent/30">
          <Truck size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight tracking-tight">Adapt</p>
          <p className="truncate text-xs text-ink-tertiary">{user.companyName}</p>
        </div>
      </Link>

      <ModuleSwitcher
        activeModule={activeModule}
        enabledModules={user.enabledModules}
        onChange={(m) => {
          setActiveModule(m);
          const first = MODULE_NAV[m]?.[0]?.href;
          if (first) router.push(first);
        }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavLinks items={navItems} onNavigate={onNavigate} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink-secondary">{user.name}</p>
            <p className="truncate text-[10px] capitalize text-ink-tertiary">{user.role}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-solid text-ink-secondary transition-colors hover:border-border-strong hover:text-danger"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: {
    name: string;
    companyName: string;
    enabledModules: ModuleId[];
    role: string;
  };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <div className="glass m-3 h-[calc(100vh-1.5rem)] rounded-2xl">
          <SidebarContent user={user} />
        </div>
      </aside>

      <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-text">
            <Truck size={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Adapt</span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="focus-ring rounded-xl p-2 text-ink-secondary"
        >
          <Menu size={20} />
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="glass-raised absolute inset-y-0 left-0 w-72"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-tertiary"
              >
                <X size={18} />
              </button>
              <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">{children}</main>
    </div>
  );
}
