"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Tone = "default" | "accent" | "success" | "warning" | "danger";

const iconTones: Record<Tone, string> = {
  default: "bg-border/50 text-ink-secondary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
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
      className={`glass focus-ring flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-all ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-raised" : ""
      } ${active ? "ring-2 ring-accent/60" : ""}`}
    >
      {icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">
          {label}
        </span>
        <span className="mt-0.5 block text-xl font-semibold leading-tight tracking-tight">
          {value}
        </span>
        {sub && (
          <span className="mt-0.5 block truncate text-xs text-ink-tertiary">{sub}</span>
        )}
      </span>
    </Tag>
  );
}
