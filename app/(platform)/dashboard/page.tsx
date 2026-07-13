"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  UserPlus,
  Megaphone,
  ArrowRight,
  Users,
  Truck,
  Inbox,
  ShieldAlert,
  MessageSquare,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Card } from "@/src/components/ui/Card";
import { StatCard } from "@/src/components/ui/StatCard";
import { Badge } from "@/src/components/ui/Badge";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import {
  daysUntil,
  formatCurrency,
  formatDate,
  formatRelative,
} from "@/src/lib/format";

interface DashboardData {
  applicants: number;
  onboarding: number;
  activeDrivers: number;
  trucks: number;
  trucksInShop: number;
  unassignedTrucks: number;
  newLeads: number;
  activeAds: number;
  spend30d: number;
  spend30dCount: number;
  recentMaintenance: {
    id: string;
    date: string;
    vendor: string;
    description: string;
    amount: number;
    category: string;
    truck: { id: string; unitNumber: string };
  }[];
  recentMessages: {
    id: string;
    body: string;
    channel: string;
    createdAt: string;
    contactName: string;
    driver: { firstName: string; lastName: string } | null;
  }[];
  expiring: {
    id: string;
    firstName: string;
    lastName: string;
    cdlExpiry: string | null;
    medCardExpiry: string | null;
  }[];
}

const bigActions = [
  {
    href: "/drivers?new=1",
    icon: UserPlus,
    title: "Add New Driver",
    body: "Scan an application or type it in — onboarding takes three steps.",
    accent: true,
  },
  {
    href: "/job-ads?new=1",
    icon: Megaphone,
    title: "Run Job Advertisement",
    body: "Post a job and leads flow straight into your pipeline.",
    accent: false,
  },
];

function expiryChip(driver: DashboardData["expiring"][number]) {
  const items: { label: string; days: number }[] = [];
  const cdlDays = daysUntil(driver.cdlExpiry);
  const medDays = daysUntil(driver.medCardExpiry);
  if (driver.cdlExpiry && cdlDays !== null && cdlDays <= 30)
    items.push({ label: "CDL", days: cdlDays });
  if (driver.medCardExpiry && medDays !== null && medDays <= 30)
    items.push({ label: "Med card", days: medDays });
  return items;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Everything that matters today, at a glance."
      />

      {/* Primary actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {bigActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 26, delay: i * 0.07 }}
            >
              <Link
                href={action.href}
                className={`focus-ring group flex h-full items-center gap-5 rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-raised ${
                  action.accent
                    ? "bg-accent text-accent-text shadow-lg shadow-accent/25"
                    : "glass"
                }`}
              >
                <div
                  className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl p-3.5 ${
                    action.accent ? "bg-white/15" : "bg-accent-soft text-accent"
                  }`}
                >
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold tracking-tight">{action.title}</h2>
                  <p
                    className={`mt-0.5 text-sm leading-relaxed ${
                      action.accent ? "opacity-85" : "text-ink-secondary"
                    }`}
                  >
                    {action.body}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className={`shrink-0 transition-transform group-hover:translate-x-1 ${
                    action.accent ? "" : "text-accent"
                  }`}
                />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* KPI row */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data ? (
          <>
            <StatCard
              label="Active drivers"
              value={data.activeDrivers}
              sub={
                data.onboarding + data.applicants > 0
                  ? `+${data.onboarding + data.applicants} in pipeline`
                  : "pipeline empty"
              }
              icon={<Users size={17} />}
              tone="accent"
              delay={0.1}
              onClick={() => (window.location.href = "/drivers")}
            />
            <StatCard
              label="Fleet"
              value={data.trucks}
              sub={
                data.trucksInShop > 0
                  ? `${data.trucksInShop} in the shop`
                  : data.unassignedTrucks > 0
                    ? `${data.unassignedTrucks} unassigned`
                    : "all rolling"
              }
              icon={<Truck size={17} />}
              tone={data.trucksInShop > 0 ? "warning" : "success"}
              delay={0.15}
              onClick={() => (window.location.href = "/fleet")}
            />
            <StatCard
              label="Maintenance · 30d"
              value={formatCurrency(data.spend30d)}
              sub={`${data.spend30dCount} invoice${data.spend30dCount === 1 ? "" : "s"}`}
              icon={<Wrench size={17} />}
              tone="default"
              delay={0.2}
              onClick={() => (window.location.href = "/fleet?tab=analytics")}
            />
            <StatCard
              label="New leads"
              value={data.newLeads}
              sub={`${data.activeAds} active ad${data.activeAds === 1 ? "" : "s"}`}
              icon={<Inbox size={17} />}
              tone={data.newLeads > 0 ? "accent" : "default"}
              delay={0.25}
              onClick={() => (window.location.href = "/job-ads")}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        )}
      </div>

      {failed && (
        <p className="mt-6 text-sm text-danger">
          Couldn&apos;t load your dashboard. Refresh the page to try again.
        </p>
      )}

      {/* Three-column detail row */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Compliance alerts */}
        <Card delay={0.25} className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-warning" />
              <h3 className="text-sm font-semibold">Compliance · 30 days</h3>
            </div>
            <Link
              href="/drivers"
              className="focus-ring rounded text-xs font-medium text-accent hover:underline"
            >
              All drivers
            </Link>
          </div>
          {!data ? (
            <Skeleton className="h-24" />
          ) : data.expiring.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              All CDLs and med cards are current. Nothing expiring soon.
            </p>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {data.expiring.map((driver) => {
                const chips = expiryChip(driver);
                return (
                  <li key={driver.id}>
                    <Link
                      href={`/drivers/${driver.id}`}
                      className="focus-ring flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-warning-soft"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {driver.firstName} {driver.lastName}
                      </span>
                      <span className="flex shrink-0 gap-1">
                        {chips.map((chip) => (
                          <Badge
                            key={chip.label}
                            tone={chip.days < 0 ? "danger" : "warning"}
                          >
                            {chip.label}{" "}
                            {chip.days < 0 ? "expired" : `${chip.days}d`}
                          </Badge>
                        ))}
                        {chips.length === 0 && (
                          <span className="text-xs text-warning">
                            {driver.cdlExpiry && `CDL ${formatDate(driver.cdlExpiry)}`}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Latest maintenance */}
        <Card delay={0.3} className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench size={15} className="text-accent" />
              <h3 className="text-sm font-semibold">Latest maintenance</h3>
            </div>
            <Link
              href="/fleet?tab=maintenance"
              className="focus-ring rounded text-xs font-medium text-accent hover:underline"
            >
              View all
            </Link>
          </div>
          {!data ? (
            <Skeleton className="h-24" />
          ) : data.recentMaintenance.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              No maintenance logged yet. Drop an invoice in the Fleet section and
              AI does the typing.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {data.recentMaintenance.map((record) => (
                <li key={record.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-medium">Unit {record.truck.unitNumber}</span>
                      <span className="text-ink-secondary">
                        {" "}
                        · {record.description || record.vendor || "Service"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-tertiary">
                      {formatDate(record.date)}
                      {record.vendor && ` · ${record.vendor}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      record.category === "accident" ? "text-danger" : ""
                    }`}
                  >
                    {formatCurrency(record.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card delay={0.35} className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-accent" />
              <h3 className="text-sm font-semibold">Recent activity</h3>
            </div>
            <Link
              href="/messages"
              className="focus-ring rounded text-xs font-medium text-accent hover:underline"
            >
              All messages
            </Link>
          </div>
          {!data ? (
            <Skeleton className="h-24" />
          ) : data.recentMessages.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              No activity yet. It&apos;ll show up here as you add drivers and run ads.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {data.recentMessages.map((message) => (
                <li key={message.id} className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm leading-snug text-ink-secondary">
                    <span className="font-medium text-ink">
                      {message.driver
                        ? `${message.driver.firstName} ${message.driver.lastName}`
                        : message.contactName || "System"}
                    </span>{" "}
                    <span className="line-clamp-1">{message.body}</span>
                  </p>
                  <span className="shrink-0 text-xs text-ink-tertiary">
                    {formatRelative(message.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick link strip */}
      {data && (data.trucksInShop > 0 || data.unassignedTrucks > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex flex-wrap gap-2"
        >
          {data.trucksInShop > 0 && (
            <Link
              href="/fleet"
              className="glass focus-ring flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-warning transition-all hover:-translate-y-0.5"
            >
              <Wrench size={12} />
              {data.trucksInShop} truck{data.trucksInShop === 1 ? "" : "s"} in the shop
              <ChevronRight size={12} />
            </Link>
          )}
          {data.unassignedTrucks > 0 && (
            <Link
              href="/fleet"
              className="glass focus-ring flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-ink-secondary transition-all hover:-translate-y-0.5"
            >
              <Truck size={12} />
              {data.unassignedTrucks} truck{data.unassignedTrucks === 1 ? "" : "s"} without a driver
              <ChevronRight size={12} />
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
