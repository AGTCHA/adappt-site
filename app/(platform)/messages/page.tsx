"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  PhoneIncoming,
  PhoneOutgoing,
  Bot,
  Mail,
  Bell,
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { StatCard } from "@/src/components/ui/StatCard";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import { formatRelative } from "@/src/lib/format";

interface MessageRow {
  id: string;
  direction: string;
  channel: string;
  contactName: string;
  body: string;
  createdAt: string;
  driver: { id: string; firstName: string; lastName: string } | null;
}

const channelFilters = [
  { key: "all", label: "All" },
  { key: "sms", label: "Texts" },
  { key: "call", label: "Calls" },
  { key: "ai_call", label: "AI agent" },
  { key: "system", label: "System" },
];

function channelIcon(message: MessageRow) {
  const inbound = message.direction === "inbound";
  switch (message.channel) {
    case "call":
      return inbound ? <PhoneIncoming size={15} /> : <PhoneOutgoing size={15} />;
    case "ai_call":
      return <Bot size={15} />;
    case "email":
      return <Mail size={15} />;
    case "system":
      return <Bell size={15} />;
    default:
      return <MessageSquare size={15} />;
  }
}

const channelLabels: Record<string, string> = {
  sms: "Text",
  call: "Call",
  ai_call: "AI agent call",
  email: "Email",
  system: "System",
};

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function MessagesPage() {
  const [allMessages, setAllMessages] = useState<MessageRow[] | null>(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    api<{ messages: MessageRow[] }>("/api/messages?channel=all")
      .then(({ messages }) => setAllMessages(messages))
      .catch(() => setAllMessages([]));
  }, []);

  useEffect(load, [load]);

  const stats = useMemo(() => {
    if (!allMessages) return null;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const thisWeek = allMessages.filter(
      (m) => new Date(m.createdAt).getTime() >= weekAgo
    );
    return {
      thisWeek: thisWeek.length,
      inbound: thisWeek.filter((m) => m.direction === "inbound").length,
      aiCalls: allMessages.filter((m) => m.channel === "ai_call").length,
    };
  }, [allMessages]);

  const groups = useMemo(() => {
    const visible = (allMessages ?? []).filter(
      (m) => filter === "all" || m.channel === filter
    );
    const result: { label: string; rows: MessageRow[] }[] = [];
    for (const message of visible) {
      const label = dayLabel(message.createdAt);
      let group = result.find((g) => g.label === label);
      if (!group) {
        group = { label, rows: [] };
        result.push(group);
      }
      group.rows.push(message);
    }
    return result;
  }, [allMessages, filter]);

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Messages"
        subtitle="Every call, text, and AI agent conversation in one timeline."
      />

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {!stats ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="This week"
              value={stats.thisWeek}
              sub="messages & calls"
              icon={<Inbox size={17} />}
              tone="accent"
            />
            <StatCard
              label="Inbound · 7d"
              value={stats.inbound}
              sub="from drivers & leads"
              icon={<ArrowDownLeft size={17} />}
              tone="success"
              delay={0.05}
            />
            <StatCard
              label="AI agent calls"
              value={stats.aiCalls}
              sub="all time"
              icon={<Bot size={17} />}
              tone="default"
              delay={0.1}
            />
          </>
        )}
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto">
        {channelFilters.map((f) => (
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

      {allMessages === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="No messages yet"
          description="Communication with your drivers and applicants will show up here — onboarding texts, calls, AI agent conversations, and new lead alerts."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="mb-2 px-1 text-sm font-semibold text-ink-secondary">
                {group.label}
              </h3>
              <div className="glass divide-y divide-border overflow-hidden rounded-2xl">
                {group.rows.map((message, i) => {
                  const inbound = message.direction === "inbound";
                  const name = message.driver
                    ? `${message.driver.firstName} ${message.driver.lastName}`
                    : message.contactName || "System";
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      className="flex items-start gap-4 px-5 py-4"
                    >
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          message.channel === "ai_call"
                            ? "bg-accent-soft text-accent"
                            : inbound
                              ? "bg-success-soft text-success"
                              : "bg-border/60 text-ink-secondary"
                        }`}
                      >
                        {channelIcon(message)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {message.driver ? (
                            <Link
                              href={`/drivers/${message.driver.id}`}
                              className="text-sm font-medium hover:text-accent hover:underline"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium">{name}</span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-ink-tertiary">
                            {inbound ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                            {channelLabels[message.channel] ?? message.channel} ·{" "}
                            {inbound ? "received" : "sent"} {formatRelative(message.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
                          {message.body}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
