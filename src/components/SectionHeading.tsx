"use client";

import ScrollReveal from "./ScrollReveal";

interface SectionHeadingProps {
  tag?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function SectionHeading({
  tag,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "";
  return (
    <ScrollReveal className={alignment}>
      {tag && <span className="tag">{tag}</span>}
      <h2
        className={`${tag ? "mt-4" : ""} text-3xl md:text-4xl font-bold tracking-tight`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-white/60 text-lg max-w-2xl ${align === "center" ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      )}
    </ScrollReveal>
  );
}
