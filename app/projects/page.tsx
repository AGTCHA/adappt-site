import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Projects | Osler Hutson",
  description:
    "Portfolio of full-stack engineering projects including ForgeDrive, a multi-tenant SaaS platform for trucking and logistics.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <SectionHeading
        tag="Portfolio"
        title="Projects"
        description="A selection of production systems I've designed, architected, and built."
      />

      <div className="mt-12 flex flex-col gap-8">
        {/* Featured: ForgeDrive */}
        <ProjectCard
          title="ForgeDrive — Multi-Tenant SaaS Platform"
          description="Single-handedly designed, architected, and built a complete SaaS platform for the trucking and logistics industry encompassing four integrated web applications, a shared component library, and a unified backend API. Delivered 1,600+ production releases in under four months across 1,600+ files, totaling ~480,000 lines of production code."
          href="/projects/forgedrive"
          featured
          stats={[
            { label: "Lines of Code", value: "480K+" },
            { label: "Releases", value: "1,635" },
            { label: "Apps", value: "4" },
            { label: "Days", value: "86" },
          ]}
          tags={[
            "React 18",
            "TypeScript",
            "Node.js",
            "Express",
            "PostgreSQL",
            "OpenAI API",
            "Tailwind CSS",
            "Vite",
            "AWS",
            "Samsara API",
          ]}
        />

        {/* A-DappT IMS */}
        <ProjectCard
          title="Initiative Management System (IMS)"
          description="A centralized hub for banks and enterprises to orchestrate strategy, investment, delivery, and benefits — turning transformation into repeatable success. Portfolio governance, risk & compliance integration, and real-time telemetry dashboards."
          href="/projects#ims"
          tags={[
            "Next.js",
            "React",
            "TypeScript",
            "PostgreSQL",
            "Prisma",
            "Three.js",
            "Tailwind CSS",
          ]}
        />

        {/* A-DappT Compliance & Identity */}
        <ProjectCard
          title="Enterprise Compliance & Digital Identity"
          description="Compliance management systems automating policies, controls, evidence, and audits with traceability and real-time risk posture. Digital identity orchestration for customer and workforce journeys — secure, seamless, and standards-first."
          href="/projects#compliance"
          tags={[
            "React",
            "TypeScript",
            "Node.js",
            "PostgreSQL",
            "OAuth 2.0",
            "Security",
          ]}
        />
      </div>
    </div>
  );
}
