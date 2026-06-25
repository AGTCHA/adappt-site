"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiLock } from "react-icons/fi";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/budget";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Unable to sign in.");
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-accent/[0.04] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-[420px]"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-5">
            <FiLock className="w-5 h-5 text-accent-cyan" />
          </div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/40">
            A-DappT
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white tracking-tight">
            Secure Portal
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Authorized access only. Sign in to continue.
          </p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/[0.07]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full h-11 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-11 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400/90 bg-red-500/[0.08] border border-red-500/15 rounded-lg px-4 py-3"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn w-full h-11 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating…" : "Continue"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[11px] text-white/25">
          Protected system · Unauthorized access is prohibited
        </p>
      </motion.div>
    </div>
  );
}
