import type { Metadata } from "next";
import Image from "next/image";
import SectionHeading from "@/components/SectionHeading";
import SkillGrid from "@/components/SkillGrid";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Osler Hutson",
  description:
    "Full-stack engineer with 10+ years across logistics, insurance, fintech, and international business — who now builds the platforms those industries need.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      {/* Intro */}
      <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
        <ScrollReveal>
          <div className="glass rounded-2xl overflow-hidden">
            <Image
              src="/assets/photo/PHOTOOOOO.jpg"
              alt="Osler Hutson"
              width={400}
              height={533}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </ScrollReveal>

        <div>
          <SectionHeading
            tag="About"
            title="Osler Hutson"
            description="Engineer, founder, and business leader who doesn't just build software — I build the right software."
          />

          <ScrollReveal delay={0.1}>
            <div className="mt-8 space-y-4 text-white/65 leading-relaxed">
              <p>
                Most developers come to the table with technical skills. I come
                with a decade of closing deals, founding companies, managing
                P&amp;Ls, and operating in the trenches of logistics, insurance,
                and fintech — <strong className="text-white/90">and then I
                learned to build the platforms those industries were missing.</strong>
              </p>
              <p>
                I&apos;ve generated over <strong className="text-white/90">$800K
                in revenue</strong> as an insurance agent, led business
                development that secured <strong className="text-white/90">€40K+
                in pilot revenue</strong> for an AI startup, founded a
                blockchain compliance platform serving the U.S. insurance
                industry, and brokered freight across the country for years
                before ever writing a line of production code.
              </p>
              <p>
                That business-first perspective is what makes my engineering
                different. When I built ForgeDrive — a complete multi-tenant
                SaaS platform with four interconnected web applications and
                480,000+ lines of code shipped in 86 days — it wasn&apos;t
                because I followed a spec. It&apos;s because I&apos;d lived
                the pain points myself and knew exactly what the industry
                needed.
              </p>
              <p>
                I&apos;m multilingual (English, German, Spanish), internationally
                experienced (7+ years in Munich, now based in Skopje), and I
                thrive in environments where engineering meets business
                strategy.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/projects/forgedrive" className="btn">
                View My Work
              </Link>
              <a
                href="/assets/resume/Osler_Hutson_CV_2026.pdf"
                download
                className="btn-outline"
              >
                Download Resume
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Skills */}
      <section className="mt-20">
        <SectionHeading
          tag="Skills"
          title="Technical Expertise"
          description="Production-tested across every layer of the stack — from database design to deployment pipelines."
        />
        <div className="mt-10">
          <SkillGrid />
        </div>
      </section>

      {/* What I Bring */}
      <section className="mt-20">
        <SectionHeading tag="Why Me" title="What Sets Me Apart" />
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Business + Engineering",
              text: "10+ years in sales, logistics, and fintech means I don't just build features — I build revenue drivers. I understand CAC, retention, and why the ops team hates your current software.",
            },
            {
              title: "Founder-Level Ownership",
              text: "I've started companies, raised capital, and shipped MVPs. I don't wait for tickets — I identify the problem, architect the solution, build it, deploy it, and measure the outcome.",
            },
            {
              title: "Extreme Execution Speed",
              text: "1,635 commits in 86 days. 480K lines of production code. Four applications, one engineer. I ship at a pace most teams can't match — without cutting corners on quality or security.",
            },
          ].map((item) => (
            <ScrollReveal key={item.title}>
              <div className="glass glass-hover rounded-2xl p-6 h-full">
                <h3 className="font-semibold text-white/90">{item.title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  {item.text}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* International & Languages */}
      <section className="mt-20">
        <ScrollReveal>
          <div className="glass rounded-2xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-white/90">International Experience</h3>
                <p className="mt-3 text-sm text-white/50 leading-relaxed">
                  7+ years living and working in Munich, Germany. Currently
                  based in Skopje, North Macedonia. Experienced working across
                  European, North American, and international markets with
                  diverse teams and stakeholders.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white/90">Languages</h3>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[
                    { lang: "English", level: "Native" },
                    { lang: "German", level: "Fluent" },
                    { lang: "Spanish", level: "Fluent" },
                    { lang: "Russian", level: "Conversational" },
                  ].map((l) => (
                    <div key={l.lang} className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <div className="text-sm font-medium text-white/80">{l.lang}</div>
                      <div className="text-xs text-white/40">{l.level}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
