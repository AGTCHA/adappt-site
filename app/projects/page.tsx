import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Projects | Osler Hutson",
  description:
    "Portfolio of full-stack engineering projects including ForgeDrive, StrategyFlow, and AgentChain — production-grade systems built from the ground up.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <SectionHeading
        tag="Portfolio"
        title="Projects"
        description="Production systems I've designed, architected, and built — each solving real business problems at scale."
      />

      <div className="mt-12 flex flex-col gap-8">
        <ProjectCard
          title="ForgeDrive — Multi-Tenant SaaS Platform"
          description="Single-handedly designed, architected, and built a complete SaaS platform for the trucking and logistics industry — four integrated web applications (TAG Hustler recruiting, Office Forge HR, Forge TMS, Forge CRM), a shared component library, and a unified backend API. Delivered 1,600+ production releases in under 90 days across 1,600+ files, totaling ~480,000 lines of production code."
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

        <ProjectCard
          title="StrategyFlow — Enterprise Initiative Management"
          description="Enterprise initiative management platform designed for banks and large organizations — enabling portfolio governance, risk & compliance tracking, regulatory reporting, and strategic execution. Kubernetes-ready architecture with OIDC SSO, background job workers, and banking-specific template engines."
          href="/projects/strategyflow"
          featured
          stats={[
            { label: "TypeScript LOC", value: "1.47M" },
            { label: "Prisma Models", value: "25+" },
            { label: "API Routes", value: "18" },
            { label: "Architecture", value: "K8s" },
          ]}
          tags={[
            "React",
            "TypeScript",
            "Prisma",
            "Express",
            "Kubernetes",
            "Docker",
            "Azure AKS",
            "OIDC/SSO",
            "Vite",
            "GitHub Actions",
          ]}
        />

        <ProjectCard
          title="AgentChain — L1 Blockchain for AI Agents"
          description="Purpose-built Layer 1 blockchain forked from go-ethereum with RandomX proof-of-work consensus, a custom key-free RPC namespace for AI agents, a terminal mining client, an OpenClaw AI skill plugin, and a React Native mobile wallet. Live network with CRD token, ~6s block times, and public infrastructure."
          href="/projects/agentchain"
          featured
          stats={[
            { label: "Commits", value: "3,951" },
            { label: "Go LOC", value: "12M+" },
            { label: "Repos", value: "3" },
            { label: "Chain ID", value: "7331" },
          ]}
          tags={[
            "Go",
            "C (RandomX)",
            "Solidity",
            "React Native",
            "Expo",
            "TypeScript",
            "EVM",
            "Docker",
            "P2P",
            "JSON-RPC",
          ]}
        />
      </div>
    </div>
  );
}
