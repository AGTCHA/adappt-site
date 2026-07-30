"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Upload,
  Users,
  Truck,
  Phone,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, driverStatusLabel, driverStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { StatCard } from "@/src/components/ui/StatCard";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { ImportDriversModal } from "@/src/components/drivers/ImportDriversModal";
import { OnboardingWizard } from "@/src/components/drivers/OnboardingWizard";
import { api } from "@/src/lib/client";
import { daysUntil, initials } from "@/src/lib/format";

interface DriverRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  onboardingStep: number;
  experienceYears: number | null;
  cdlExpiry: string | null;
  medCardExpiry: string | null;
  cdlNumber: string;
  source: string;
  truck: { id: string; unitNumber: string } | null;
  documents: { id: string; type: string }[];
}

/** Compliance chips for a driver card: expired > expiring > missing. */
function complianceStatus(driver: DriverRow) {
  const chips: { label: string; tone: "danger" | "warning" | "success" }[] = [];
  const cdl = daysUntil(driver.cdlExpiry);
  const med = daysUntil(driver.medCardExpiry);

  if (cdl !== null) {
    if (cdl < 0) chips.push({ label: "CDL expired", tone: "danger" });
    else if (cdl <= 30) chips.push({ label: `CDL ${cdl}d`, tone: "warning" });
  }
  if (med !== null) {
    if (med < 0) chips.push({ label: "Med expired", tone: "danger" });
    else if (med <= 30) chips.push({ label: `Med ${med}d`, tone: "warning" });
  }
  return chips;
}

function isCompliant(driver: DriverRow) {
  const cdl = daysUntil(driver.cdlExpiry);
  const med = daysUntil(driver.medCardExpiry);
  return cdl !== null && cdl > 30 && med !== null && med > 30;
}

function hasAlert(driver: DriverRow) {
  const cdl = daysUntil(driver.cdlExpiry);
  const med = daysUntil(driver.medCardExpiry);
  return (cdl !== null && cdl <= 30) || (med !== null && med <= 30);
}

function DriversContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drivers, setDrivers] = useState<DriverRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(searchParams.get("new") === "1");
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(() => {
    api<{ drivers: DriverRow[] }>("/api/drivers")
      .then((data) => setDrivers(data.drivers))
      .catch(() => setFailed(true));
  }, []);

  useEffect(load, [load]);

  const counts = useMemo(() => {
    const all = drivers ?? [];
    return {
      active: all.filter((d) => d.status === "active").length,
      onboarding: all.filter((d) => d.status === "onboarding").length,
      applicant: all.filter((d) => d.status === "applicant").length,
      alerts: all.filter((d) => d.status !== "inactive" && hasAlert(d)).length,
    };
  }, [drivers]);

  const visible = (drivers ?? []).filter((driver) => {
    if (filter === "alerts") {
      if (driver.status === "inactive" || !hasAlert(driver)) return false;
    } else if (filter !== "all" && driver.status !== filter) {
      return false;
    }
    if (query) {
      const haystack =
        `${driver.firstName} ${driver.lastName} ${driver.phone}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const toggleFilter = (key: string) =>
    setFilter((current) => (current === key ? "all" : key));

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Drivers"
        subtitle="Applicants and your existing team, in one place."
        actions={
          <>
            <Button variant="secondary" icon={<Upload size={15} />} onClick={() => setImportOpen(true)}>
              Import spreadsheet
            </Button>
            <Button icon={<UserPlus size={15} />} onClick={() => setWizardOpen(true)}>
              Add Driver
            </Button>
          </>
        }
      />

      {/* KPI row — click to filter */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {drivers === null ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Active"
              value={counts.active}
              sub="on the road"
              icon={<Users size={17} />}
              tone="success"
              active={filter === "active"}
              onClick={() => toggleFilter("active")}
            />
            <StatCard
              label="Onboarding"
              value={counts.onboarding}
              sub="in progress"
              icon={<Clock size={17} />}
              tone="warning"
              active={filter === "onboarding"}
              onClick={() => toggleFilter("onboarding")}
              delay={0.05}
            />
            <StatCard
              label="Applicants"
              value={counts.applicant}
              sub="waiting on you"
              icon={<UserPlus size={17} />}
              tone="accent"
              active={filter === "applicant"}
              onClick={() => toggleFilter("applicant")}
              delay={0.1}
            />
            <StatCard
              label="Compliance alerts"
              value={counts.alerts}
              sub="expiring in 30 days"
              icon={<ShieldAlert size={17} />}
              tone={counts.alerts > 0 ? "danger" : "default"}
              active={filter === "alerts"}
              onClick={() => toggleFilter("alerts")}
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Search + inactive toggle */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            className="input pl-9"
            placeholder="Search by name or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {[
            { key: "all", label: "Everyone" },
            { key: "inactive", label: "Inactive" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`focus-ring shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-accent text-accent-text"
                  : "text-ink-secondary hover:bg-accent-soft"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {failed ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Couldn't load drivers"
          description="Something went wrong on our end. Refresh the page to try again."
        />
      ) : drivers === null ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No drivers yet"
          description="Add your first driver in three quick steps, or import your existing team from a spreadsheet."
          action={
            <div className="flex gap-2">
              <Button icon={<UserPlus size={15} />} onClick={() => setWizardOpen(true)}>
                Add Driver
              </Button>
              <Button variant="secondary" icon={<Upload size={15} />} onClick={() => setImportOpen(true)}>
                Import
              </Button>
            </div>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="No matches"
          description="No drivers match your search or filter. Try clearing them."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((driver, i) => {
            const chips = complianceStatus(driver);
            const docCount = driver.documents.length;
            return (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, delay: Math.min(i * 0.03, 0.25) }}
              >
                <Link
                  href={`/drivers/${driver.id}`}
                  className="glass focus-ring group flex h-full flex-col rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-raised"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                      {initials(driver.firstName, driver.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {driver.firstName} {driver.lastName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-tertiary">
                        {driver.phone ? (
                          <>
                            <Phone size={10} className="shrink-0" />
                            {driver.phone}
                          </>
                        ) : (
                          "No phone"
                        )}
                        {driver.experienceYears != null &&
                          ` · ${driver.experienceYears} yrs`}
                      </p>
                    </div>
                    <Badge tone={driverStatusTone[driver.status] ?? "neutral"}>
                      {driverStatusLabel[driver.status] ?? driver.status}
                    </Badge>
                  </div>

                  {/* Onboarding progress */}
                  {driver.status === "onboarding" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] font-medium text-ink-tertiary">
                        <span>Onboarding</span>
                        <span>step {Math.min(driver.onboardingStep + 1, 3)} of 3</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/60">
                        <div
                          className="h-full rounded-full bg-warning transition-all"
                          style={{
                            width: `${Math.min(((driver.onboardingStep + 1) / 3) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer chips */}
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                    {driver.truck ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-border/50 px-2 py-0.5 text-[11px] font-medium text-ink-secondary">
                        <Truck size={10} />
                        Unit {driver.truck.unitNumber}
                      </span>
                    ) : driver.status === "active" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-border/40 px-2 py-0.5 text-[11px] text-ink-tertiary">
                        <Truck size={10} />
                        No truck
                      </span>
                    ) : null}
                    {chips.map((chip) => (
                      <Badge key={chip.label} tone={chip.tone} className="!text-[11px]">
                        {chip.label}
                      </Badge>
                    ))}
                    {chips.length === 0 && isCompliant(driver) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                        <ShieldCheck size={10} />
                        Compliant
                      </span>
                    )}
                    {docCount > 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-tertiary">
                        <FileText size={10} />
                        {docCount}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <OnboardingWizard
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          if (searchParams.get("new")) router.replace("/drivers");
        }}
        onDone={load}
      />
      <ImportDriversModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={load}
      />
    </div>
  );
}

export default function DriversPage() {
  return (
    <Suspense>
      <DriversContent />
    </Suspense>
  );
}
