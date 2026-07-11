"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  PhoneIncoming,
  PhoneOutgoing,
  Bot,
  Mail,
  Bell,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
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

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageRow[] | null>(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback((channel: string) => {
    setMessages(null);
    api<{ messages: MessageRow[] }>(`/api/messages?channel=${channel}`)
      .then(({ messages }) => setMessages(messages))
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => load(filter), [filter, load]);

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Every call, text, and AI agent conversation in one timeline."
      />

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

      {messages === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="No messages yet"
          description="Communication with your drivers and applicants will show up here — onboarding texts, calls, AI agent conversations, and new lead alerts."
        />
      ) : (
        <div className="space-y-2">
          {messages.map((message, i) => {
            const inbound = message.direction === "inbound";
            const name = message.driver
              ? `${message.driver.firstName} ${message.driver.lastName}`
              : message.contactName || "System";
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, delay: Math.min(i * 0.03, 0.3) }}
                className="glass flex items-start gap-4 rounded-2xl px-5 py-4"
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
      )}
    </div>
  );
}
