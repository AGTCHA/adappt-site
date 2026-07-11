import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-border/60 text-ink-secondary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
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
  converted: "success",
  dismissed: "neutral",
};
