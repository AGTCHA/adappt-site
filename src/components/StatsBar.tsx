"use client";

import AnimatedCounter from "./AnimatedCounter";
import ScrollReveal from "./ScrollReveal";

const stats = [
  { value: 480000, suffix: "+", label: "Lines of Code", prefix: "" },
  { value: 1635, suffix: "", label: "Commits", prefix: "" },
  { value: 4, suffix: "", label: "Web Applications", prefix: "" },
  { value: 86, suffix: "", label: "Days to Ship", prefix: "" },
];

export default function StatsBar() {
  return (
    <ScrollReveal>
      <div className="glass rounded-2xl p-8 md:p-10">
        <p className="text-xs uppercase tracking-widest text-accent-cyan/70 font-mono mb-6 text-center">
          Most Recent Project — ForgeDrive SaaS Platform
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <AnimatedCounter
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
