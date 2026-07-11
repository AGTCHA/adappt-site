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
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Card } from "@/src/components/ui/Card";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import { formatDate, formatRelative } from "@/src/lib/format";

interface DashboardData {
  applicants: number;
  onboarding: number;
  activeDrivers: number;
  trucks: number;
  newLeads: number;
  activeAds: number;
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
    body: "Start the 3-step onboarding — application, documents, and a text link your driver finishes on their phone.",
    accent: true,
  },
  {
    href: "/job-ads?new=1",
    icon: Megaphone,
    title: "Run Job Advertisement",
    body: "Post a job ad and get applicant leads flowing straight into your pipeline automatically.",
    accent: false,
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const stats = data
    ? [
        { label: "Active drivers", value: data.activeDrivers, icon: Users, href: "/drivers" },
        { label: "Trucks", value: data.trucks, icon: Truck, href: "/fleet" },
        { label: "New leads", value: data.newLeads, icon: Inbox, href: "/job-ads" },
        { label: "In onboarding", value: data.onboarding + data.applicants, icon: UserPlus, href: "/drivers" },
      ]
    : [];

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
                className={`focus-ring group block h-full rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-raised ${
                  action.accent
                    ? "bg-accent text-accent-text shadow-lg shadow-accent/25"
                    : "glass"
                }`}
              >
                <div
                  className={`mb-5 flex h-13 w-13 items-center justify-center rounded-2xl p-3 ${
                    action.accent ? "bg-white/15" : "bg-accent-soft text-accent"
                  }`}
                >
                  <Icon size={26} />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">{action.title}</h2>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    action.accent ? "opacity-85" : "text-ink-secondary"
                  }`}
                >
                  {action.body}
                </p>
                <span
                  className={`mt-5 inline-flex items-center gap-1.5 text-sm font-medium ${
                    action.accent ? "" : "text-accent"
                  }`}
                >
                  Get started
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data
          ? stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} hover delay={0.1 + i * 0.05} className="p-5">
                  <Link href={stat.href} className="focus-ring block">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-secondary">
                        {stat.label}
                      </span>
                      <Icon size={15} className="text-ink-tertiary" />
                    </div>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                  </Link>
                </Card>
              );
            })
          : Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
      </div>

      {failed && (
        <p className="mt-6 text-sm text-danger">
          Couldn&apos;t load your dashboard. Refresh the page to try again.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Compliance alerts */}
        <Card delay={0.25} className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-warning" />
            <h3 className="text-sm font-semibold">Compliance — next 30 days</h3>
          </div>
          {!data ? (
            <Skeleton className="h-24" />
          ) : data.expiring.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              All CDLs and med cards are current. Nothing expiring soon.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.expiring.map((driver) => (
                <li key={driver.id}>
                  <Link
                    href={`/drivers/${driver.id}`}
                    className="focus-ring flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-warning-soft"
                  >
                    <span className="text-sm font-medium">
                      {driver.firstName} {driver.lastName}
                    </span>
                    <span className="text-xs text-warning">
                      {driver.cdlExpiry && `CDL ${formatDate(driver.cdlExpiry)}`}
                      {driver.cdlExpiry && driver.medCardExpiry && " · "}
                      {driver.medCardExpiry && `Med card ${formatDate(driver.medCardExpiry)}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card delay={0.3} className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Recent activity</h3>
          </div>
          {!data ? (
            <Skeleton className="h-24" />
          ) : data.recentMessages.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              No activity yet. It&apos;ll show up here as you add drivers and run ads.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.recentMessages.map((message) => (
                <li key={message.id} className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm text-ink-secondary">
                    <span className="font-medium text-ink">
                      {message.driver
                        ? `${message.driver.firstName} ${message.driver.lastName}`
                        : message.contactName || "System"}
                    </span>{" "}
                    · {message.body}
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
    </div>
  );
}
