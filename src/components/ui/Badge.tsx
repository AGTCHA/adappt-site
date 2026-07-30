import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "violet";

const tones: Record<Tone, string> = {
  neutral: "bg-border/70 text-ink-secondary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  violet: "bg-violet-soft text-violet",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const driverStatusTone: Record<string, Tone> = {
  applicant: "accent",
  onboarding: "warning",
  active: "success",
  inactive: "neutral",
};

export const driverStatusLabel: Record<string, string> = {
  applicant: "Applicant",
  onboarding: "Onboarding",
  active: "Active",
  inactive: "Inactive",
};

export const truckStatusTone: Record<string, Tone> = {
  active: "success",
  in_shop: "warning",
  inactive: "neutral",
};

export const truckStatusLabel: Record<string, string> = {
  active: "On the road",
  in_shop: "In the shop",
  inactive: "Parked",
};

export const leadStatusTone: Record<string, Tone> = {
  new: "accent",
  contacted: "warning",
  no_answer: "neutral",
  interested: "success",
  not_interested: "neutral",
  doesnt_qualify: "danger",
  converted: "success",
  dismissed: "neutral",
};

export const leadDispositionLabel: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  no_answer: "No answer",
  interested: "Interested",
  not_interested: "Not interested",
  doesnt_qualify: "Doesn't qualify",
  converted: "Converted",
};
