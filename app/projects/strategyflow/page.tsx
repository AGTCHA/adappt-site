import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import ScrollReveal from "@/components/ScrollReveal";
import TechBadge from "@/components/TechBadge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StrategyFlow — Case Study | Osler Hutson",
  description:
    "Enterprise initiative management platform for banks and enterprises — Kubernetes-ready, with OIDC auth, background job queues, and full portfolio governance.",
};

const stats = [
  { label: "TypeScript LOC", value: "1.47M" },
  { label: "Prisma Models", value: "25+" },
  { label: "API Routes", value: "18" },
  { label: "Architecture", value: "K8s" },
];

const features = [
  {
    tag: "Portfolio Governance",
    title: "Initiative & Workstream Management",
    items: [
      "Full initiative lifecycle management — from idea capture through prioritization, execution, and benefits realization — with configurable workflow states",
      "Workstream orchestration enabling teams to organize initiatives into strategic programs with dedicated leads and cross-functional team assignments",
      "Objective tracking aligned to organizational strategy, connecting top-level goals to specific initiatives and measuring progress across the portfolio",
      "Season-based scoring system with assessor assignments, enabling periodic portfolio reviews and data-driven investment decisions",
      "Labels and view presets for dynamic filtering — allowing executives, PMs, and team leads to create personalized dashboard views",
    ],
  },
  {
    tag: "Compliance & Risk",
    title: "Health Assessments, Risks & Change Requests",
    items: [
      "Health assessment framework with structured evaluations by designated assessors — tracking initiative health over time with historical audit trails",
      "Risk register with ownership, categorization, and direct linkage to affected initiatives for comprehensive risk posture visibility",
      "Change request workflow with requester/approver roles, enabling formal governance over scope, schedule, and budget changes",
      "Escalation management system with owner/receiver/triggerer tracking, connecting escalations to specific initiatives for resolution tracking",
      "BPO (Business Process Outsourcing) requirement tracking with provider assignments and initiative-level compliance mapping",
    ],
  },
  {
    tag: "Banking & Regulatory",
    title: "Banking Template Engine — Stopanska Banka Alignment",
    items: [
      "Banking-specific template engine aligned to the Stopanska Banka TPO (Transformation Programme Office) rulebook",
      "Report pack system with templates, scheduled runs, and organization-scoped report generation — enabling standardized regulatory reporting",
      "Graph-list mapping infrastructure connecting data sources to visual reports, enabling dynamic dashboard generation from structured data",
      "Benefit records tracking tied to initiatives — quantifying financial impact, cost savings, and strategic value for executive reporting",
    ],
  },
  {
    tag: "Collaboration",
    title: "Teams, Comments & Activity Feeds",
    items: [
      "Team management with manager assignments, member roles, and workstream-level team allocation",
      "Threaded commenting system with @mention notifications, enabling contextual discussion on any initiative, risk, or change request",
      "Assignment engine distributing work items across team members with status tracking and workload visibility",
      "Organization-level analytics with cross-initiative views, trend analysis, and portfolio-wide health dashboards",
    ],
  },
  {
    tag: "Infrastructure",
    title: "Kubernetes-Ready Enterprise Architecture",
    items: [
      "Monorepo with npm workspaces: @strategyflow/backend, @strategyflow/frontend, and @strategyflow/shared packages",
      "Express + Prisma backend with SQLite (development) — designed for PostgreSQL swap in production via env config",
      "React + Vite frontend with dedicated store layer, custom hooks, and service abstraction for API communication",
      "Background job queue system (worker deployment) for async processing — report generation, notifications, and scheduled tasks",
      "Kubernetes manifests: backend deployment, worker deployment, HPA (Horizontal Pod Autoscaler), ingress, and Azure SecretProviderClass",
      "OIDC authentication integration for enterprise SSO, with Microsoft Graph API token management for calendar/mail access",
      "CI/CD via GitHub Actions with placeholder deployment pipeline ready for Azure ACR/AKS wiring",
      "Docker and Docker Compose configurations for local development and container-based deployment",
    ],
  },
];

const techStack = [
  "React",
  "TypeScript",
  "Vite",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "Prisma",
  "SQLite / PostgreSQL",
  "Kubernetes",
  "Docker",
  "Azure AKS",
  "Azure SecretProviderClass",
  "OIDC / SSO",
  "Microsoft Graph API",
  "GitHub Actions",
  "Vitest",
  "HPA Autoscaling",
  "Nginx Ingress",
];

export default function StrategyFlowPage() {
  return (
    <div className="relative">
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <SectionHeading
          tag="Case Study"
          title="StrategyFlow"
          description="Enterprise initiative management platform designed for banks and large organizations — enabling portfolio governance, risk & compliance tracking, regulatory reporting, and strategic execution. Built with Kubernetes-ready architecture for enterprise-grade deployment."
        />
        <div className="mt-10">
          <div className="glass rounded-2xl p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text-blue">
                  {s.value}
                </div>
                <div className="text-xs text-white/40 mt-1 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-xs text-purple-400 font-mono">
            Enterprise Platform
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs text-blue-400 font-mono">
            Banking & Financial Services
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <ScrollReveal>
          <div className="glass rounded-2xl p-8 md:p-10">
            <h3 className="text-xl font-bold mb-6">System Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { name: "@strategyflow/frontend", desc: "React + Vite SPA", detail: "Store, hooks, services" },
                { name: "@strategyflow/backend", desc: "Express + Prisma API", detail: "18 route modules" },
                { name: "@strategyflow/shared", desc: "Shared Types & Utils", detail: "Cross-package types" },
              ].map((pkg) => (
                <div
                  key={pkg.name}
                  className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-center"
                >
                  <div className="text-sm font-semibold gradient-text-blue font-mono">
                    {pkg.name}
                  </div>
                  <div className="text-xs text-white/40 mt-1">{pkg.desc}</div>
                  <div className="text-[10px] text-white/25 mt-2">{pkg.detail}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="text-xs text-white/30">&#9660;</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-sm font-semibold text-white/80">Kubernetes Cluster</div>
                  <div className="text-xs text-white/40 mt-1">
                    Backend + Worker deployments &bull; HPA &bull; Ingress
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-sm font-semibold text-white/80">Azure Integration</div>
                  <div className="text-xs text-white/40 mt-1">
                    AKS &bull; SecretProviderClass &bull; ACR
                  </div>
                </div>
              </div>
              <div className="text-xs text-white/30">&#9660;</div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 w-full max-w-sm text-center">
                <div className="text-sm font-semibold text-white/80">Prisma + PostgreSQL</div>
                <div className="text-xs text-white/40 mt-1">
                  25+ models &bull; Migrations &bull; Seed scripts
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {features.map((feature) => (
        <section key={feature.tag} className="mx-auto max-w-7xl px-6 py-12">
          <ScrollReveal delay={0.05}>
            <div className="glass rounded-2xl p-8 md:p-10">
              <span className="tag">{feature.tag}</span>
              <h3 className="mt-4 text-xl md:text-2xl font-bold">
                {feature.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {feature.items.map((item) => (
                  <li
                    key={item.slice(0, 40)}
                    className="flex items-start gap-3 text-sm text-white/60 leading-relaxed"
                  >
                    <span className="text-accent mt-0.5 shrink-0">&#9654;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-6 py-12">
        <ScrollReveal>
          <h3 className="text-xl font-bold mb-6">Technical Stack</h3>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <TechBadge key={tech} name={tech} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <ScrollReveal>
          <div className="glass rounded-3xl p-10 md:p-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              Enterprise-Grade, From Day One
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              StrategyFlow demonstrates my ability to architect for enterprise scale — Kubernetes orchestration, OIDC SSO, background workers, and banking-specific compliance frameworks.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/contact" className="btn">Get In Touch</Link>
              <Link href="/projects/agentchain" className="btn-outline">AgentChain Case Study</Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
