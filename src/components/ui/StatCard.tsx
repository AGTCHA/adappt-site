"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "violet";

const iconTones: Record<Tone, string> = {
  default: "bg-border/60 text-ink-secondary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  violet: "bg-violet-soft text-violet",
};

const railTones: Record<Tone, string> = {
  default: "from-border-strong/40 to-transparent",
  accent: "from-accent to-accent/40",
  success: "from-success to-success/40",
  warning: "from-warning to-warning/40",
  danger: "from-danger to-danger/40",
  violet: "from-violet to-violet/40",
};

/**
 * Compact KPI card used at the top of every section.
 * Optionally clickable (acts as a filter or drill-down).
 */
export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
  active,
  onClick,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  /** Highlight ring when this stat is the active filter. */
  active?: boolean;
  onClick?: () => void;
  delay?: number;
}) {
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay }}
      className={`glass focus-ring relative flex items-center gap-3.5 overflow-hidden rounded-2xl px-4 py-3.5 text-left transition-all ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-raised" : ""
      } ${active ? "ring-2 ring-accent/60" : ""}`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${railTones[tone]}`}
      />
      {icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
          {label}
        </span>
        <span className="mt-0.5 block text-2xl font-semibold leading-tight tracking-tight text-ink">
          {value}
        </span>
        {sub && (
          <span className="mt-0.5 block truncate text-xs text-ink-secondary">{sub}</span>
        )}
      </span>
    </Tag>
  );
}
