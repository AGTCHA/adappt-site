"use client";

import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import Link from "next/link";
import HeroCanvas from "@/components/HeroCanvas";
import StatsBar from "@/components/StatsBar";
import ProjectCard from "@/components/ProjectCard";
import TechMarquee from "@/components/TechMarquee";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <HeroCanvas />
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent/[0.08] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-accent-cyan/[0.06] rounded-full blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="tag">Available for New Opportunities</span>

            <h1 className="mt-6 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-white">
              Osler Hutson
            </h1>

            <div className="mt-5 text-xl md:text-2xl text-white/80 h-8 font-light">
              <TypeAnimation
                sequence={[
                  "I turn business problems into production software.",
                  3000,
                  "480K lines of code. 4 apps. 86 days. One engineer.",
                  3000,
                  "$800K+ in revenue closed. Platforms built to match.",
                  3000,
                  "10+ years in logistics, fintech & insurance — now I build the tools.",
                  3000,
                  "Fluent in English, German, Spanish — and TypeScript.",
                  3000,
                ]}
                repeat={Infinity}
                speed={55}
                cursor={true}
              />
            </div>

            <p className="mt-8 text-white/75 text-lg max-w-2xl leading-relaxed">
              Most engineers write code.{" "}
              <strong className="text-white font-semibold">
                I&apos;ve closed six-figure deals, founded companies across two
                continents, and operated in the trenches of logistics,
                insurance, and fintech
              </strong>{" "}
              — then taught myself to engineer the platforms those industries
              were missing. The result? A complete multi-tenant SaaS platform,
              shipped solo, in under 90 days.
            </p>
            <p className="mt-3 text-white/50 text-base max-w-2xl leading-relaxed">
              From negotiating freight rates in Chicago to architecting
              real-time fleet tracking systems with AI — I don&apos;t just
              know the tech stack, I know the business it serves.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/projects" className="btn">
                View My Work
              </Link>
              <a
                href="/assets/resume/Osler_Hutson_CV_2025.pdf"
                download
                className="btn-outline"
              >
                Download Resume
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="mx-auto max-w-7xl px-6 -mt-8 relative z-10">
        <StatsBar />
      </section>

      {/* Featured Project */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <ScrollReveal>
          <span className="tag">Featured Project</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            From Industry Expertise to Production Code
          </h2>
          <p className="mt-3 text-white/50 max-w-2xl leading-relaxed">
            Years of firsthand experience in trucking and logistics — then I
            built the platform the industry was missing.
          </p>
        </ScrollReveal>
        <div className="mt-8">
          <ProjectCard
            title="ForgeDrive — Multi-Tenant SaaS Platform"
            description="A complete SaaS ecosystem for the trucking and logistics industry — four integrated web applications, a shared component library, and a unified backend API. Built entirely solo, from architecture to production deployment, in 86 days."
            href="/projects/forgedrive"
            featured
            stats={[
              { label: "Lines of Code", value: "480K+" },
              { label: "Production Releases", value: "1,635" },
              { label: "Applications", value: "4" },
              { label: "Days to Ship", value: "86" },
            ]}
            tags={[
              "React 18",
              "TypeScript",
              "Node.js",
              "Express",
              "PostgreSQL",
              "OpenAI",
              "Tailwind CSS",
              "AWS",
            ]}
          />
        </div>
      </section>

      {/* Tech Marquee */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <ScrollReveal>
          <p className="text-center text-sm text-white/30 uppercase tracking-widest mb-4">
            Technologies I Work With
          </p>
        </ScrollReveal>
        <TechMarquee />
      </section>

      {/* Value Proposition Cards */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              number: "10+",
              label: "Years in business",
              desc: "Sales, logistics, fintech, insurtech — I know what makes industries tick before I write a single line.",
            },
            {
              number: "4",
              label: "Languages spoken",
              desc: "English, German, Spanish, conversational Russian. International experience across Europe and North America.",
            },
            {
              number: "3",
              label: "Companies founded",
              desc: "AgentChain, A-DappT, ForgeDrive. I build things that solve real problems — not just demos.",
            },
          ].map((item) => (
            <ScrollReveal key={item.label} delay={0.1}>
              <div className="glass glass-hover rounded-2xl p-7">
                <div className="text-4xl font-bold gradient-text-blue">{item.number}</div>
                <div className="mt-1 text-sm font-semibold text-white/80 uppercase tracking-wide">{item.label}</div>
                <p className="mt-3 text-sm text-white/45 leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <ScrollReveal>
          <div className="glass rounded-3xl p-10 md:p-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              Your Next Engineer Should Understand Your Business
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto leading-relaxed">
              I bring a decade of real-world business experience to every
              line of code. If you need someone who ships fast, thinks
              commercially, and builds systems that actually move the
              needle — let&apos;s talk.
            </p>
            <div className="mt-8 flex justify-center flex-wrap gap-4">
              <Link href="/contact" className="btn">
                Get In Touch
              </Link>
              <Link href="/about" className="btn-outline">
                The Full Story
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
