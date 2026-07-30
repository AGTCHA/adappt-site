"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  Circle,
  SkipForward,
  ChevronRight,
  Rocket,
  Building,
  Truck,
  Users,
  FileText,
  Link2,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed" | "skipped";
  order: number;
}

const stepIcons: Record<string, React.ReactNode> = {
  carrier_identity: <Building size={18} />,
  add_trucks: <Truck size={18} />,
  add_drivers: <Users size={18} />,
  first_load: <FileText size={18} />,
  connect_edi: <Link2 size={18} />,
  factoring: <Settings size={18} />,
  telematics: <Rocket size={18} />,
};

export default function OnboardingPage() {
  const toast = useToast();
  const [steps, setSteps] = useState<OnboardingStep[] | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchOnboarding = useCallback(() => {
    api<{ steps: OnboardingStep[] }>("/api/tms/onboarding")
      .then(({ steps: rows }) => setSteps(rows.sort((a, b) => a.order - b.order)))
      .catch(() => setSteps([]));
  }, []);

  useEffect(fetchOnboarding, [fetchOnboarding]);

  const completedCount = steps?.filter((s) => s.status === "completed").length ?? 0;
  const totalCount = steps?.length ?? 7;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function markComplete(stepId: string) {
    setProcessing(stepId);
    try {
      await api(`/api/tms/onboarding/${stepId}`, {
        method: "PATCH",
        json: { status: "completed" },
      });
      toast("success", "Step completed");
      fetchOnboarding();
    } catch (err) {
      toast("error", "Failed", (err as Error).message);
    } finally {
      setProcessing(null);
    }
  }

  async function markSkipped(stepId: string) {
    setProcessing(stepId);
    try {
      await api(`/api/tms/onboarding/${stepId}`, {
        method: "PATCH",
        json: { status: "skipped" },
      });
      toast("success", "Step skipped");
      fetchOnboarding();
    } catch (err) {
      toast("error", "Failed", (err as Error).message);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Onboarding"
        subtitle="Get your TMS up and running — complete each step to unlock full functionality."
      />

      {/* Progress indicator */}
      {steps !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">Setup progress</p>
              <p className="text-xs text-ink-tertiary">
                {completedCount} of {totalCount} steps completed
              </p>
            </div>
            <span className="text-2xl font-bold text-accent">{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/60">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent to-violet"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Steps */}
      {steps === null ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isCompleted = step.status === "completed";
            const isSkipped = step.status === "skipped";
            const icon = stepIcons[step.id] ?? <Circle size={18} />;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={`glass rounded-2xl p-5 transition-all ${
                  isCompleted
                    ? "border border-success/20 bg-success-soft/10"
                    : isSkipped
                    ? "opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Status icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isCompleted
                        ? "bg-success-soft text-success"
                        : isSkipped
                        ? "bg-border/60 text-ink-tertiary"
                        : "bg-accent-soft text-accent"
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={18} /> : icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{step.title}</p>
                      {isCompleted && (
                        <span className="text-xs font-medium text-success">Done</span>
                      )}
                      {isSkipped && (
                        <span className="text-xs font-medium text-ink-tertiary">Skipped</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-secondary">{step.description}</p>
                  </div>

                  {/* Actions */}
                  {!isCompleted && !isSkipped && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<SkipForward size={13} />}
                        onClick={() => markSkipped(step.id)}
                        loading={processing === step.id}
                      >
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        icon={<CheckCircle size={13} />}
                        onClick={() => markComplete(step.id)}
                        loading={processing === step.id}
                      >
                        Complete
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* All done CTA */}
      {steps && progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 flex flex-col items-center rounded-2xl bg-gradient-to-br from-accent/10 to-violet/10 p-8 text-center"
        >
          <Rocket size={32} className="mb-3 text-accent" />
          <h3 className="text-lg font-semibold">You&apos;re all set!</h3>
          <p className="mt-1 max-w-md text-sm text-ink-secondary">
            Your TMS is fully configured. Start creating loads and managing your fleet.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => (window.location.href = "/tms/loads")}>
              Go to loads <ChevronRight size={14} />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
