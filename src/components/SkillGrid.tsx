"use client";

import ScrollReveal from "./ScrollReveal";

interface SkillCategory {
  title: string;
  skills: string[];
}

const categories: SkillCategory[] = [
  {
    title: "Languages & Frameworks",
    skills: [
      "TypeScript",
      "JavaScript",
      "SQL",
      "React 18",
      "Node.js",
      "Express",
      "Next.js",
      "HTML/CSS",
      "Tailwind CSS",
    ],
  },
  {
    title: "Architecture & Patterns",
    skills: [
      "Multi-tenant SaaS",
      "Monorepo (npm workspaces)",
      "REST API Design",
      "RBAC",
      "Row-Level Security",
      "JWT Auth",
      "OAuth 2.0",
      "PostgreSQL",
    ],
  },
  {
    title: "Integrations & APIs",
    skills: [
      "OpenAI (GPT-4 Vision)",
      "Samsara Telematics",
      "Google Workspace",
      "AWS (SES, EC2)",
      "NHTSA VIN API",
      "FMCSA/DOT",
      "Leaflet Maps",
    ],
  },
  {
    title: "Tools & Infrastructure",
    skills: [
      "Git",
      "Vite",
      "Nginx",
      "Let's Encrypt",
      "Playwright (E2E)",
      "CI/CD Scripting",
      "Linux Admin",
      "AWS EC2",
      "Puppeteer",
    ],
  },
];

export default function SkillGrid() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {categories.map((cat, idx) => (
        <ScrollReveal key={cat.title} delay={idx * 0.08}>
          <div className="glass rounded-2xl p-6 h-full">
            <h3 className="text-sm font-semibold text-accent-cyan uppercase tracking-wider mb-4">
              {cat.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {cat.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.04] border border-white/[0.06] text-white/70 hover:text-white hover:border-accent/30 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
