"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Truck } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-text shadow-sm shadow-accent/30">
          <Truck size={20} />
        </div>
        <span className="text-xl font-semibold tracking-tight">Adapt</span>
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="glass w-full max-w-md rounded-3xl p-8"
      >
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-ink-secondary">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </motion.div>
      <p className="mt-6 text-sm text-ink-secondary">{footer}</p>
    </div>
  );
}
