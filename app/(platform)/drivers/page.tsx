"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Search, UserPlus, Upload, Users, ChevronRight, Truck } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, driverStatusLabel, driverStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { ImportDriversModal } from "@/src/components/drivers/ImportDriversModal";
import { OnboardingWizard } from "@/src/components/drivers/OnboardingWizard";
import { api } from "@/src/lib/client";
import { initials } from "@/src/lib/format";

interface DriverRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  onboardingStep: number;
  experienceYears: number | null;
  truck: { id: string; unitNumber: string } | null;
  documents: { id: string; type: string }[];
}

const filters = [
  { key: "all", label: "All" },
  { key: "applicant", label: "Applicants" },
  { key: "onboarding", label: "Onboarding" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

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

  const visible = (drivers ?? []).filter((driver) => {
    if (filter !== "all" && driver.status !== filter) return false;
    if (query) {
      const haystack = `${driver.firstName} ${driver.lastName} ${driver.phone}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Drivers"
        subtitle="Applicants and your existing team, in one list."
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

      {/* Search + filters */}
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
        <div className="flex gap-1 overflow-x-auto">
          {filters.map((f) => (
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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
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
        <div className="space-y-2">
          {visible.map((driver, i) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Link
                href={`/drivers/${driver.id}`}
                className="glass focus-ring group flex items-center gap-4 rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-raised"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {initials(driver.firstName, driver.lastName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {driver.firstName} {driver.lastName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-tertiary">
                    {driver.phone || "No phone"}
                    {driver.experienceYears != null && ` · ${driver.experienceYears} yrs exp`}
                  </p>
                </div>
                {driver.truck && (
                  <span className="hidden items-center gap-1.5 text-xs text-ink-secondary sm:flex">
                    <Truck size={13} />
                    Unit {driver.truck.unitNumber}
                  </span>
                )}
                <Badge tone={driverStatusTone[driver.status] ?? "neutral"}>
                  {driverStatusLabel[driver.status] ?? driver.status}
                </Badge>
                <ChevronRight size={16} className="shrink-0 text-ink-tertiary transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
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
