import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import Timeline, { type TimelineEntry } from "@/components/Timeline";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Experience | Osler Hutson",
  description:
    "From freight brokerage to blockchain startups to building a 480K-line SaaS platform — a career built on understanding industries and then engineering solutions for them.",
};

const entries: TimelineEntry[] = [
  {
    period: "Dec 2025 — Present",
    title: "Founder & Full-Stack Software Engineer",
    company: "ForgeDrive (forgedrive.io) | TAG Trans Inc.",
    description:
      "Single-handedly designed, architected, and shipped a multi-tenant SaaS platform for trucking and logistics — four integrated web applications, 480K+ lines of production code, 1,600+ releases in 86 working days.",
    highlights: [
      "Architected monorepo platform with four React apps (Recruiting, HR, TMS, CRM) backed by shared Express/TypeScript API and PostgreSQL",
      "Engineered multi-tenant data isolation with row-level security, passing all internal security audits",
      "Built AI-powered document extraction using OpenAI Vision API for MVRs, PSPs, and driver documents",
      "Integrated Samsara telematics for real-time GPS tracking, HOS monitoring, and safety scoring",
      "Created 15+ automated cron jobs, deployment pipelines, and full CI/CD to AWS EC2",
    ],
    tags: ["React 18", "TypeScript", "Node.js", "PostgreSQL", "OpenAI", "AWS"],
  },
  {
    period: "2024 — Present",
    title: "Founder & Software Engineer",
    company: "A-DappT DOOEL — Skopje, North Macedonia",
    description:
      "Founded a software company building enterprise platforms for banking, compliance, and digital identity.",
    highlights: [
      "Built Initiative Management System (IMS) for banks — portfolio governance, risk/compliance, and telemetry",
      "Developed compliance management and digital identity orchestration platforms",
      "Led consulting engagements for platform architecture and operating model transformation",
    ],
    tags: ["Next.js", "React", "TypeScript", "PostgreSQL", "Prisma", "Three.js"],
  },
  {
    period: "Aug 2024 — Aug 2025",
    title: "Head of Business Development",
    company: "FinqUp Technology OOD — Skopje (Remote)",
    description:
      "Led business development for an AI-powered automation platform targeting financial institutions, insurers, and tourism across Europe and North America.",
    highlights: [
      "Generated €40K+ in pilot revenue and secured key partnerships across multiple sectors",
      "Translated client pain points into formalized requirements and product priorities",
      "Achieved 30% increase in qualified leads through multilingual stakeholder engagement (EN/DE/ES)",
      "Supported €50K pre-seed funding round with data-driven proposals and pitch materials",
    ],
    tags: ["Business Development", "AI Platforms", "Multilingual", "Fintech"],
  },
  {
    period: "Jan 2021 — Present",
    title: "Founder & CEO",
    company: "AgentChain — Sarasota, FL (Remote)",
    description:
      "Founded a blockchain-powered compliance platform for the U.S. insurance industry's 1.58 million agents.",
    highlights: [
      "Led cross-functional team of 6 through agile development to deliver MVP with 100 active daily users",
      "Formalized business requirements into roadmaps for smart contracts, API integrations, and UI/UX",
      "Projected 75,000 users over 24 months; raised initial capital for scalable microservice architecture",
    ],
    tags: ["Blockchain", "Insurtech", "Product Management", "Agile"],
  },
  {
    period: "Mar 2019 — Apr 2022",
    title: "Senior Licensed Agent",
    company: "US Health Advisors — Sarasota, FL",
    description:
      "Licensed health, accident, and life insurance agent across Florida and 15+ states.",
    highlights: [
      "Generated over $800,000 in converted business through consultative sales",
      "Customized solutions based on deep understanding of client pain points and compliance requirements",
    ],
    tags: ["Insurance", "Sales", "Client Relations"],
  },
  {
    period: "Jul 2017 — Jul 2019",
    title: "Account Executive (Freight Broker)",
    company: "FTL Transportation — Chicago, IL",
    description:
      "Managed shipping lanes and client relationships in full-truckload logistics.",
    highlights: [
      "Onboarded and transitioned key client accounts, building long-term partnerships",
      "Optimized carrier rates and routing by analyzing traffic patterns, availability, and market conditions",
    ],
    tags: ["Logistics", "Freight Brokerage", "Account Management"],
  },
  {
    period: "Nov 2015 — Jul 2017",
    title: "Account Executive (Freight Broker)",
    company: "BMM Logistics — Chicago, IL",
    description:
      "Brokered freight and managed shipping operations for enterprise clients.",
    highlights: [
      "Built and maintained established shipping lanes with focus on cost efficiency and reliability",
      "Negotiated competitive carrier rates while minimizing delays across seasonal demand fluctuations",
    ],
    tags: ["Logistics", "Freight", "Negotiation"],
  },
  {
    period: "Aug 2008 — May 2015",
    title: "Account Executive",
    company: "NexGen Travel Distribution — Munich, Germany",
    description:
      "Advanced from data management to executive role at an international travel technology company.",
    highlights: [
      "Acted as liaison between clients and development teams, clarifying requirements and facilitating product demos",
      "Negotiated revenue-sharing contracts worldwide and prioritized features for platform launches",
    ],
    tags: ["Travel Tech", "International Business", "Germany"],
  },
];

export default function ExperiencePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <SectionHeading
        tag="Experience"
        title="A Decade of Building Businesses — Then Building the Software"
        description="From freight brokerage floors in Chicago to founding startups to shipping a 480K-line SaaS platform solo. Every role shaped how I think about engineering."
      />

      <div className="mt-14">
        <Timeline entries={entries} />
      </div>

      {/* Summary */}
      <section className="mt-20">
        <ScrollReveal>
          <div className="glass rounded-3xl p-10 md:p-14">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold">The Thread Through Everything</h3>
                <p className="mt-3 text-sm text-white/55 leading-relaxed">
                  Whether I was negotiating carrier rates, selling insurance
                  policies, raising capital for a blockchain startup, or
                  architecting a multi-tenant SaaS platform — the constant
                  has been understanding a problem deeply and then executing
                  relentlessly to solve it.
                </p>
                <p className="mt-3 text-sm text-white/55 leading-relaxed">
                  That&apos;s what makes me different as an engineer. I don&apos;t
                  just write code that passes review — I build software that
                  drives revenue, reduces ops overhead, and actually gets
                  adopted by the people who use it.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold">What I&apos;m Looking For</h3>
                <p className="mt-3 text-sm text-white/55 leading-relaxed">
                  A senior or lead engineering role at a company that values
                  ownership, velocity, and business acumen. I&apos;m at my best
                  when I can own a product area end-to-end — architecture,
                  implementation, deployment, and iteration based on real
                  user feedback.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/contact" className="btn">
                    Let&apos;s Talk
                  </Link>
                  <a
                    href="/assets/resume/Osler_Hutson_CV_2026.pdf"
                    download
                    className="btn-outline"
                  >
                    Download Resume
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
