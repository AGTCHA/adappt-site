"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/src/components/AuthCard";
import { Button } from "@/src/components/ui/Button";
import { Field, Input } from "@/src/components/ui/Field";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/auth/signup", { method: "POST", json: form });
      toast("success", "Welcome to Adapt!", "Your account is ready.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast("error", "Couldn't create account", (error as Error).message);
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Free to start. No credit card needed."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your name">
            <Input
              required
              autoComplete="name"
              placeholder="Sam Carter"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Company">
            <Input
              required
              autoComplete="organization"
              placeholder="Carter Trucking"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Email">
          <Input
            required
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
