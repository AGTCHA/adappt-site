"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Truck } from "lucide-react";
import { Skeleton } from "@/src/components/ui/EmptyState";

interface TrackData {
  firstName: string;
  lastName: string;
  companyName: string;
  pipelineStage: string;
  stageLabel: string;
  steps: { id: string; label: string }[];
  currentStepIndex: number;
  checklist: { id: string; label: string; done: boolean }[];
  terminal: boolean;
}

export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TrackData | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    fetch(`/api/track/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setInvalid(true));
  }, [token]);

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-sm rounded-3xl p-8 text-center">
          <h1 className="text-lg font-semibold">Link not found</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            This tracking link is invalid or expired. Contact your recruiter for an updated link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-text shadow-sm shadow-accent/30">
          <Truck size={20} />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight tracking-tight">
            {data?.companyName ?? "Application status"}
          </p>
          <p className="text-xs text-ink-tertiary">Powered by Adapt</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-lg rounded-3xl p-7"
      >
        {!data ? (
          <Skeleton className="h-64" />
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold tracking-tight">
                Hi {data.firstName}!
              </h1>
              <p className="mt-1 text-sm text-ink-secondary">
                Current status:{" "}
                <span className="font-semibold text-ink">{data.stageLabel}</span>
              </p>
              {data.terminal && (
                <p className="mt-2 text-sm text-ink-tertiary">
                  Your application is no longer active. Contact the recruiter if you have questions.
                </p>
              )}
            </div>

            <div className="mb-8 space-y-3">
              {data.steps.map((step, i) => {
                const done = i < data.currentStepIndex || data.pipelineStage === "hired";
                const current = i === data.currentStepIndex && !data.terminal;
                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        done
                          ? "bg-success text-white"
                          : current
                            ? "bg-accent text-accent-text"
                            : "bg-border/60 text-ink-tertiary"
                      }`}
                    >
                      {done ? <Check size={14} /> : i + 1}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${current ? "text-ink" : "text-ink-secondary"}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-5">
              <h2 className="mb-3 text-sm font-semibold">Document checklist</h2>
              <ul className="space-y-2">
                {data.checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        item.done ? "bg-success-soft text-success" : "bg-border/50 text-ink-tertiary"
                      }`}
                    >
                      {item.done ? <Check size={12} /> : "·"}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
