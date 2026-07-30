"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  /** Small uppercase label above the title (module / section cue). */
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="mb-8 flex flex-wrap items-end justify-between gap-4"
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-[2rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-secondary">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-accent to-violet" />
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </motion.div>
  );
}
