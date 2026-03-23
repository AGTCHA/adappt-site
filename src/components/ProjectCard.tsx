"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import TechBadge from "./TechBadge";

interface ProjectCardProps {
  title: string;
  description: string;
  href: string;
  tags: string[];
  featured?: boolean;
  stats?: { label: string; value: string }[];
}

export default function ProjectCard({
  title,
  description,
  href,
  tags,
  featured = false,
  stats,
}: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
    >
      <Link href={href} className="block group">
        <div
          className={`glass glass-hover gradient-border rounded-2xl p-8 ${featured ? "md:p-10" : ""}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              {featured && (
                <span className="tag mb-4 inline-block">Featured Project</span>
              )}
              <h3
                className={`font-bold tracking-tight ${featured ? "text-2xl md:text-3xl" : "text-xl"}`}
              >
                {title}
              </h3>
            </div>
            <span className="text-white/30 group-hover:text-accent group-hover:translate-x-1 transition-all text-lg mt-1">
              &rarr;
            </span>
          </div>

          <p
            className={`mt-3 text-white/60 leading-relaxed ${featured ? "text-base max-w-2xl" : "text-sm"}`}
          >
            {description}
          </p>

          {stats && (
            <div className="mt-6 flex flex-wrap gap-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-lg font-bold gradient-text-blue">
                    {s.value}
                  </div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TechBadge key={tag} name={tag} />
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
