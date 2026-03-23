"use client";

import { motion } from "framer-motion";

const technologies = [
  "React 18",
  "TypeScript",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Tailwind CSS",
  "Next.js",
  "Vite",
  "Three.js",
  "D3.js",
  "OpenAI API",
  "AWS",
  "Docker",
  "Playwright",
  "TanStack Query",
  "Prisma",
];

export default function TechMarquee() {
  const doubled = [...technologies, ...technologies];

  return (
    <div className="relative overflow-hidden py-6">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050505] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050505] to-transparent z-10" />
      <motion.div
        className="flex gap-4 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((tech, i) => (
          <span
            key={`${tech}-${i}`}
            className="inline-block px-5 py-2.5 rounded-full text-sm font-medium bg-white/[0.03] border border-white/[0.06] text-white/50"
          >
            {tech}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
