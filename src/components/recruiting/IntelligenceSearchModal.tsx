"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, User, Inbox, Loader2 } from "lucide-react";
import { Modal } from "@/src/components/ui/Modal";
import { api } from "@/src/lib/client";

interface SearchResult {
  kind: "driver" | "lead";
  id: string;
  title: string;
  subtitle: string;
  phone: string;
  href: string;
}

export function IntelligenceSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { results: rows } = await api<{ results: SearchResult[] }>(
        `/api/recruiting/search?q=${encodeURIComponent(q)}`
      );
      setResults(rows);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <Modal open={open} onClose={onClose} title="Intelligence search" subtitle="Drivers and leads across your company">
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
        <input
          ref={inputRef}
          className="input pl-10"
          placeholder="Name, phone, email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-ink-secondary">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : query.length < 2 ? (
          <p className="py-8 text-center text-sm text-ink-tertiary">Type at least 2 characters</p>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-tertiary">No matches</p>
        ) : (
          <ul className="space-y-1">
            {results.map((r) => (
              <li key={`${r.kind}-${r.id}`}>
                <Link
                  href={r.href}
                  onClick={onClose}
                  className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent-soft"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-solid ring-1 ring-border">
                    {r.kind === "driver" ? <User size={16} /> : <Inbox size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="truncate text-xs text-ink-secondary">{r.subtitle}</p>
                  </div>
                  {r.phone && (
                    <span className="shrink-0 text-xs text-ink-tertiary">{r.phone}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
