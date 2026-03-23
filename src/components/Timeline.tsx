"use client";

import ScrollReveal from "./ScrollReveal";
import TechBadge from "./TechBadge";

export interface TimelineEntry {
  period: string;
  title: string;
  company: string;
  description: string;
  highlights: string[];
  tags?: string[];
}

interface TimelineProps {
  entries: TimelineEntry[];
}

export default function Timeline({ entries }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-accent/40 via-accent-cyan/20 to-transparent" />

      <div className="flex flex-col gap-12">
        {entries.map((entry, idx) => {
          const isLeft = idx % 2 === 0;
          return (
            <ScrollReveal
              key={entry.period}
              delay={idx * 0.1}
              className="relative"
            >
              {/* Dot */}
              <div className="absolute left-[15px] md:left-1/2 md:-translate-x-1/2 top-1 z-10">
                <div className="h-[10px] w-[10px] rounded-full bg-accent shadow-[0_0_12px_rgba(30,144,255,0.4)]" />
              </div>

              <div
                className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? "md:mr-auto md:pr-0" : "md:ml-auto md:pl-0"}`}
              >
                <div className="glass rounded-2xl p-6">
                  <span className="text-xs text-accent-cyan font-mono uppercase tracking-wider">
                    {entry.period}
                  </span>
                  <h3 className="mt-2 text-xl font-bold">{entry.title}</h3>
                  <p className="text-sm text-white/50">{entry.company}</p>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">
                    {entry.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {entry.highlights.map((h) => (
                      <li
                        key={h}
                        className="text-sm text-white/50 flex items-start gap-2"
                      >
                        <span className="text-accent mt-1 shrink-0">
                          &bull;
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  {entry.tags && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {entry.tags.map((t) => (
                        <TechBadge key={t} name={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
