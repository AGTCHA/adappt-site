import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import StatsBar from "@/components/StatsBar";
import ScrollReveal from "@/components/ScrollReveal";
import TechBadge from "@/components/TechBadge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ForgeDrive — Case Study | Osler Hutson",
  description:
    "Deep dive into ForgeDrive: a multi-tenant SaaS platform with four integrated web applications built single-handedly in 86 days.",
};

const features = [
  {
    tag: "Recruiting Pipeline",
    title: "TAG Hustler — Driver Recruiting Platform",
    items: [
      "Full-featured recruiting pipeline with drag-and-drop Kanban board, archived driver views with restore capability, and real-time pipeline stage transitions",
      "Commission and referral tracking engine with monthly views, bulk mark-as-paid, team effort bonuses, retention bonus calculations, and automated recalculation workflows",
      "Marketplace Leads system with CSV import (3-tier parsing strategy), central lead pool distribution, recruiter assignment, and lead-to-pipeline conversion",
      "Driver Portal allowing self-service access to profiles, referral tracking, and document management",
      "AI-powered document extraction using OpenAI Vision API — automatically classifies and extracts data from driver documents, MVR reports, and PSP records including garbled PDF handling via image conversion",
    ],
  },
  {
    tag: "Corporate HR",
    title: "Office Forge — HR & Employee Management",
    items: [
      "Comprehensive HR platform with employee directory, BambooHR-style profile tabs, PTO management with location-based policies, bi-weekly payroll-driven accrual, and anniversary-based resets",
      "Interactive D3.js organizational chart with drag-and-drop employee reassignment, clickable detail panels, and executive-level org structure visualization",
      "Job Offers system with customizable HTML templates, company logo libraries, PDF generation, public e-signature pages, and draft management",
      "Dispatch shift scheduling with weekday rotation, Saturday/holiday coverage, team calendar integration, and automated shift notification emails",
      'Built "Kaffana" — an internal ideas board with social features (likes, comments, @mention notifications, announcement posts) to foster company culture',
    ],
  },
  {
    tag: "Transportation",
    title: "Forge TMS — Transportation Management",
    items: [
      "Full TMS with load management, fleet tracking, driver messaging, customer management, financial settlements, safety compliance, and maintenance scheduling",
      "Samsara telematics integration for real-time GPS tracking, Hours of Service (HOS) monitoring, fuel/idling analytics, and driver safety behavior scoring",
      "Fleet Command Center dashboard with dual-map views, lane performance visualization, and advanced fleet filtering with dynamic map-card synchronization",
    ],
  },
  {
    tag: "Sales & CRM",
    title: "Forge CRM — Customer Relationship Management",
    items: [
      "CRM with customer management, deals pipeline, activity tracking, DOT/FMCSA carrier lookup and validation, carrier intelligence, and automated weekly digest emails",
      "Equipment/truck sales workflows with VIN decoding (NHTSA API), photo carousels, cost breakdowns, truck portal with instant list/delist, and public-facing truck profiles",
      "Report generation engine with templates, custom report builder, and organization-specific dashboard configurations",
    ],
  },
  {
    tag: "Safety & Compliance",
    title: "Safety Dashboard & Compliance Engine",
    items: [
      "Safety Dashboard with driver queue management, drug screen scheduling, daily digest emails, and a dedicated driver safety review workspace",
      "Safety scoring algorithm with category-aware weighting, time decay, and automated MVR/PSP data write-back from AI-extracted documents",
      "VOE (Verification of Employment) workflows with employer request/response tracking and automated outreach",
    ],
  },
  {
    tag: "AI & Automation",
    title: "AI Integration & Platform Automation",
    items: [
      "OpenAI across the platform: document extraction/classification, fleet CSV smart import, corporate chat assistant, offer template generation, CRM deal analysis, and PTO scheduling suggestions",
      "15+ automated cron jobs including fleet-recruiter sync emails, safety digests, weekly CRM digests, PTO accrual processing, shift notifications, referral bonus reminders, and life-event celebration emails",
      "Automated deployment pipeline with SSH-based deploys to AWS EC2, Nginx reverse proxy configuration, and Let's Encrypt SSL",
    ],
  },
];

const techStack = [
  "React 18",
  "TypeScript",
  "Vite",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "PostgreSQL",
  "TanStack React Query",
  "React Router 6",
  "D3.js",
  "Three.js",
  "Chart.js / Recharts",
  "Leaflet",
  "FullCalendar",
  "dnd-kit",
  "OpenAI API",
  "Samsara API",
  "AWS SES",
  "Google OAuth / Calendar API",
  "Playwright",
  "Puppeteer",
  "Nginx",
  "AWS EC2",
];

export default function ForgeDrivePage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <SectionHeading
          tag="Case Study"
          title="ForgeDrive"
          description="A multi-tenant SaaS platform for the trucking and logistics industry — four integrated web applications, a shared component library, and a unified backend API. Built single-handedly from the ground up."
        />
        <div className="mt-10">
          <StatsBar />
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <ScrollReveal>
          <div className="glass rounded-2xl p-8 md:p-10">
            <h3 className="text-xl font-bold mb-6">Platform Architecture</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { name: "TAG Hustler", desc: "Recruiting Pipeline" },
                { name: "Office Forge", desc: "Corporate HR" },
                { name: "Forge TMS", desc: "Transportation Mgmt" },
                { name: "Forge CRM", desc: "Customer Relations" },
              ].map((app) => (
                <div
                  key={app.name}
                  className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-center"
                >
                  <div className="text-sm font-semibold gradient-text-blue">
                    {app.name}
                  </div>
                  <div className="text-xs text-white/40 mt-1">{app.desc}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="text-xs text-white/30">&#9660;</div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 w-full max-w-md text-center">
                <div className="text-sm font-semibold text-white/80">
                  Shared Express/TypeScript API
                </div>
                <div className="text-xs text-white/40 mt-1">
                  Multi-tenant middleware &bull; RBAC &bull; Row-Level Security
                </div>
              </div>
              <div className="text-xs text-white/30">&#9660;</div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 w-full max-w-sm text-center">
                <div className="text-sm font-semibold text-white/80">
                  PostgreSQL
                </div>
                <div className="text-xs text-white/40 mt-1">
                  Company-scoped session variables &bull; Data isolation
                </div>
              </div>
            </div>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="text-sm font-semibold text-accent-cyan">
                  Multi-Tenant Isolation
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Company-scoped middleware, PostgreSQL session variables, and
                  row-level security passing all internal security audits
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-sm font-semibold text-accent-cyan">
                  God Mode Admin
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Cross-application administration enabling platform operators to
                  manage any tenant with automatic scope enforcement
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-sm font-semibold text-accent-cyan">
                  Granular RBAC
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Tab-level permissions, role toggling
                  (recruiter/management/safety/admin), and org-scoped data
                  visibility
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Feature Sections */}
      {features.map((feature) => (
        <section
          key={feature.tag}
          className="mx-auto max-w-7xl px-6 py-12"
        >
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
                    <span className="text-accent mt-0.5 shrink-0">
                      &#9654;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </section>
      ))}

      {/* Tech Stack */}
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <ScrollReveal>
          <div className="glass rounded-3xl p-10 md:p-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              Interested in Working Together?
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              I bring the same intensity, ownership, and velocity to every
              engineering challenge.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/contact" className="btn">
                Get In Touch
              </Link>
              <Link href="/experience" className="btn-outline">
                View Experience
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
