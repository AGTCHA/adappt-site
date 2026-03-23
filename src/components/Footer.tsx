import Link from "next/link";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-sm text-white/40">
          &copy; {new Date().getFullYear()} Osler Hutson. Built with Next.js,
          React & TypeScript.
        </p>
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/oslerhutson"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white transition"
            aria-label="GitHub"
          >
            <FaGithub size={18} />
          </a>
          <a
            href="https://linkedin.com/in/oslerhutson"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white transition"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={18} />
          </a>
          <a
            href="mailto:ohutson@agentchain.io"
            className="text-white/40 hover:text-white transition"
            aria-label="Email"
          >
            <FaEnvelope size={18} />
          </a>
          <Link
            href="/contact"
            className="ml-2 text-sm text-white/50 hover:text-accent transition"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
