"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import ScrollReveal from "@/components/ScrollReveal";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

const contactLinks = [
  {
    icon: FaEnvelope,
    label: "Email",
    value: "ohutson@agentchain.io",
    href: "mailto:ohutson@agentchain.io",
  },
  {
    icon: FaLinkedin,
    label: "LinkedIn",
    value: "linkedin.com/in/oslerhutson",
    href: "https://linkedin.com/in/oslerhutson",
  },
  {
    icon: FaGithub,
    label: "GitHub",
    value: "github.com/oslerhutson",
    href: "https://github.com/oslerhutson",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <SectionHeading
        tag="Contact"
        title="Let's Connect"
        description="I'm actively looking for my next engineering role. Whether you have an opportunity or just want to chat about tech — I'd love to hear from you."
      />

      <div className="mt-12 grid md:grid-cols-2 gap-8">
        {/* Direct Links */}
        <ScrollReveal>
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6 inline-flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-green-400/80">
                Open to Opportunities
              </span>
            </div>

            {contactLinks.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="glass glass-hover rounded-2xl p-6 flex items-center gap-4 group block"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-10 w-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/50 group-hover:text-accent transition">
                  <link.icon size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium">{link.label}</div>
                  <div className="text-xs text-white/40">{link.value}</div>
                </div>
                <span className="ml-auto text-white/20 group-hover:text-accent transition">
                  &rarr;
                </span>
              </motion.a>
            ))}
          </div>
        </ScrollReveal>

        {/* Contact Form */}
        <ScrollReveal delay={0.1}>
          <form
            action="/api/lead"
            method="post"
            className="glass rounded-2xl p-8 flex flex-col gap-4"
          >
            <h3 className="text-lg font-semibold mb-2">Send a Message</h3>
            <input
              name="name"
              placeholder="Your name"
              required
              className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 text-sm outline-none focus:border-accent/40 transition placeholder:text-white/25"
            />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 text-sm outline-none focus:border-accent/40 transition placeholder:text-white/25"
            />
            <input
              name="company"
              placeholder="Company (optional)"
              className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 text-sm outline-none focus:border-accent/40 transition placeholder:text-white/25"
            />
            <textarea
              name="message"
              placeholder="What would you like to discuss?"
              rows={4}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm outline-none focus:border-accent/40 transition resize-none placeholder:text-white/25"
            />
            <button className="btn mt-2" type="submit">
              Send Message
            </button>
          </form>
        </ScrollReveal>
      </div>
    </div>
  );
}
