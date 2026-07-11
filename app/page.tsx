"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Truck,
  Users,
  Megaphone,
  Wrench,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";

const features = [
  {
    icon: <Users size={20} />,
    title: "Hire drivers in days, not weeks",
    body: "A 3-step onboarding flow your applicants can finish from their phone — application, documents, done.",
  },
  {
    icon: <Megaphone size={20} />,
    title: "Job ads that fill seats",
    body: "Post a job ad in minutes and watch leads flow straight into your driver pipeline automatically.",
  },
  {
    icon: <Wrench size={20} />,
    title: "Know your cost per mile",
    body: "Snap a photo of any repair invoice — AI reads it, files it, and updates your cents-per-mile instantly.",
  },
  {
    icon: <MessageSquare size={20} />,
    title: "Every conversation in one place",
    body: "Calls, texts, and AI agent conversations with drivers and applicants, all in a single clean timeline.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-text shadow-sm shadow-accent/30">
            <Truck size={18} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Adapt</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="focus-ring rounded-xl px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="focus-ring rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-text shadow-sm shadow-accent/25 transition-colors hover:bg-accent-hover"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 text-center sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-secondary backdrop-blur">
              <Sparkles size={13} className="text-accent" />
              Built for small trucking companies
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              Hire drivers.
              <br />
              <span className="text-accent">Run your fleet.</span>
              <br />
              Skip the busywork.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-secondary sm:text-lg">
              Adapt is the recruiting and fleet management platform simple
              enough to use on day one — no training, no consultants, no
              spreadsheets.
            </p>
            <div className="mt-9 flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="focus-ring group inline-flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-base font-medium text-accent-text shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover"
              >
                Start free
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-tertiary">
              Sign up with email — running in under two minutes.
            </p>
          </motion.div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 220, damping: 26, delay: i * 0.06 }}
              className="glass rounded-2xl p-7"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                {feature.body}
              </p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-ink-tertiary">
        © {new Date().getFullYear()} Adapt · a-dappt.com
      </footer>
    </div>
  );
}
