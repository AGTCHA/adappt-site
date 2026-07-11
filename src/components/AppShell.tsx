"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Truck,
  Megaphone,
  MessageSquare,
  LifeBuoy,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { api } from "@/src/lib/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/fleet", label: "Fleet", icon: Truck },
  { href: "/job-ads", label: "Job Ads", icon: Megaphone },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`focus-ring relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "text-accent"
                : "text-ink-secondary hover:bg-accent-soft hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-accent-soft"
              />
            )}
            <Icon size={17} className="relative z-10" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  user,
  onNavigate,
}: {
  user: { name: string; companyName: string };
  onNavigate?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col p-4">
      <Link href="/dashboard" onClick={onNavigate} className="mb-8 flex items-center gap-2.5 px-2 pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-text shadow-sm shadow-accent/30">
          <Truck size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight tracking-tight">Adapt</p>
          <p className="truncate text-xs text-ink-tertiary">{user.companyName}</p>
        </div>
      </Link>

      <NavLinks onNavigate={onNavigate} />

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <p className="truncate text-xs font-medium text-ink-secondary">{user.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-solid text-ink-secondary transition-colors hover:border-border-strong hover:text-danger"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; companyName: string };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <div className="glass m-3 h-[calc(100vh-1.5rem)] rounded-2xl">
          <SidebarContent user={user} />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-text">
            <Truck size={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Adapt</span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="focus-ring rounded-xl p-2 text-ink-secondary"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="glass-raised absolute inset-y-0 left-0 w-72"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-tertiary"
              >
                <X size={18} />
              </button>
              <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
