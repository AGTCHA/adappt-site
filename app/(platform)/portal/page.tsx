"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Package,
  Smartphone,
  FileText,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";

const portalFeatures = [
  {
    icon: Package,
    title: "My Loads",
    description: "Drivers see assigned loads, pickup/delivery details, and status updates.",
    href: "/tms/loads",
    badge: "TMS",
  },
  {
    icon: MessageSquare,
    title: "Messages",
    description: "Two-way SMS and in-app messaging between dispatch and drivers.",
    href: "/messages",
    badge: "Recruiting",
  },
  {
    icon: FileText,
    title: "Documents",
    description: "Upload CDL, med card, and onboarding paperwork from their phone.",
    href: "/drivers",
    badge: "Recruiting",
  },
  {
    icon: MapPin,
    title: "Trip details",
    description: "Stop sequence, customer info, and delivery confirmations on the go.",
    href: "/tms",
    badge: "TMS",
  },
] as const;

export default function PortalPreviewPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Portal"
        title="Driver Portal"
        subtitle="Admin preview of what drivers see in the mobile portal."
      />

      <Card className="mb-6 flex items-start gap-4 p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Smartphone size={24} />
        </div>
        <div>
          <h3 className="font-semibold">Portal preview mode</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
            This page shows the features available to drivers when the Portal module is
            enabled. Links below open the admin views of the same data drivers access.
          </p>
          <Badge tone="accent" className="mt-3">
            Module: portal
          </Badge>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {portalFeatures.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 280, damping: 26 }}
            >
              <Link
                href={feature.href}
                className="glass focus-ring group flex h-full flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-raised"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon size={20} />
                  </div>
                  <Badge tone="neutral">{feature.badge}</Badge>
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-secondary">
                  {feature.description}
                </p>
                <span className="mt-3 text-xs font-medium text-accent group-hover:underline">
                  Open admin view →
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
