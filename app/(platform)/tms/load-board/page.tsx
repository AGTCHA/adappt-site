"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Key,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { CreateLoadModal } from "@/src/components/tms/CreateLoadModal";
import {
  EQUIPMENT_TYPES,
  EQUIPMENT_LABEL,
  LOADBOARD_PROVIDERS,
  LOADBOARD_LABEL,
} from "@/src/lib/tms/constants";

interface LoadBoardResult {
  id: string;
  origin: string;
  originState: string;
  destination: string;
  destState: string;
  equipment: string;
  miles: number;
  rate: number | null;
  ratePerMile: number | null;
  pickupDate: string;
  deliveryDate: string | null;
  weight: number | null;
  commodity: string | null;
  provider: string;
  postingAge: string;
  contactName: string | null;
  contactPhone: string | null;
  demo?: boolean;
}

interface Credential {
  id: string;
  provider: string;
  username: string;
  active: boolean;
  lastSyncAt: string | null;
}

interface SearchForm {
  origin: string;
  destination: string;
  equipment: string;
  dateFrom: string;
  dateTo: string;
  providers: string[];
}

const defaultSearch: SearchForm = {
  origin: "",
  destination: "",
  equipment: "",
  dateFrom: "",
  dateTo: "",
  providers: [],
};

export default function LoadBoardPage() {
  const toast = useToast();
  const [results, setResults] = useState<LoadBoardResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState<SearchForm>(defaultSearch);
  const [credentials, setCreds] = useState<Credential[]>([]);
  const [credsOpen, setCredsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [prefillValues, setPrefillValues] = useState<Record<string, unknown>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchCreds = useCallback(() => {
    api<{ credentials: Credential[] }>("/api/tms/loadboard/credentials")
      .then(({ credentials: rows }) => setCreds(rows))
      .catch(() => setCreds([]));
  }, []);

  useEffect(fetchCreds, [fetchCreds]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setSearching(true);
    setDismissed(new Set());
    try {
      const body: Record<string, unknown> = {};
      if (form.origin) body.origin = form.origin;
      if (form.destination) body.destination = form.destination;
      if (form.equipment) body.equipment = form.equipment;
      if (form.dateFrom) body.dateFrom = form.dateFrom;
      if (form.dateTo) body.dateTo = form.dateTo;
      if (form.providers.length > 0) body.providers = form.providers;
      const res = await api<{ results: LoadBoardResult[] }>("/api/tms/loadboard/search", {
        method: "POST",
        json: body,
      });
      setResults(res.results);
    } catch (err) {
      toast("error", "Search failed", (err as Error).message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function bookLoad(result: LoadBoardResult) {
    setPrefillValues({
      customerName: result.contactName || "",
      stops: [
        {
          key: Math.random().toString(36).slice(2),
          type: "pickup" as const,
          city: result.origin,
          state: result.originState,
          zip: "",
          address: "",
          appointment: result.pickupDate ? result.pickupDate.slice(0, 16) : "",
          instructions: "",
        },
        {
          key: Math.random().toString(36).slice(2),
          type: "delivery" as const,
          city: result.destination,
          state: result.destState,
          zip: "",
          address: "",
          appointment: result.deliveryDate ? result.deliveryDate.slice(0, 16) : "",
          instructions: "",
        },
      ],
      equipment: result.equipment || "dry_van",
      linehaul: result.rate?.toString() ?? "",
      loadedMiles: result.miles?.toString() ?? "",
      weight: result.weight?.toString() ?? "",
      commodity: result.commodity ?? "",
    });
    setCreateOpen(true);
  }

  function dismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  function toggleProvider(p: string) {
    setForm((f) => ({
      ...f,
      providers: f.providers.includes(p)
        ? f.providers.filter((x) => x !== p)
        : [...f.providers, p],
    }));
  }

  const visibleResults = results?.filter((r) => !dismissed.has(r.id)) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Load Board"
        subtitle="Search external load boards for available freight."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<Key size={14} />}
            onClick={() => setCredsOpen(true)}
          >
            Credentials
          </Button>
        }
      />

      {/* Search form */}
      <Card className="mb-6 p-5">
        <form onSubmit={search} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <Field label="Origin">
              <Input
                placeholder="City or state"
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
              />
            </Field>
            <Field label="Destination">
              <Input
                placeholder="City or state"
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
              />
            </Field>
            <Field label="Equipment">
              <Select
                value={form.equipment}
                onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
              >
                <option value="">Any</option>
                {EQUIPMENT_TYPES.map((eq) => (
                  <option key={eq} value={eq}>
                    {EQUIPMENT_LABEL[eq]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Input
                type="date"
                value={form.dateFrom}
                onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value }))}
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={form.dateTo}
                onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))}
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" loading={searching} icon={<Search size={15} />} className="w-full">
                Search
              </Button>
            </div>
          </div>

          {/* Provider multi-select */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-secondary">Providers</p>
            <div className="flex flex-wrap gap-1.5">
              {LOADBOARD_PROVIDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleProvider(p)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    form.providers.includes(p)
                      ? "bg-accent text-accent-text"
                      : "bg-surface-solid text-ink-secondary ring-1 ring-border hover:ring-ink-tertiary"
                  }`}
                >
                  {LOADBOARD_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Card>

      {/* Results */}
      {visibleResults === null ? (
        <EmptyState
          icon={<Search size={24} />}
          title="Search for loads"
          description="Enter origin, destination, or equipment type to find available freight."
        />
      ) : searching ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : visibleResults.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="No results"
          description="Try broadening your search criteria."
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {/* Table header */}
          <div className="hidden grid-cols-[1.2fr_1.2fr_0.7fr_0.5fr_0.6fr_0.5fr_0.6fr_auto] gap-3 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary lg:grid">
            <span>Origin</span>
            <span>Destination</span>
            <span>Equipment</span>
            <span>Miles</span>
            <span>Rate</span>
            <span>RPM</span>
            <span>Pickup</span>
            <span>Actions</span>
          </div>

          {visibleResults.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.15) }}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-5 py-3 last:border-0 hover:bg-accent-soft/30 lg:grid lg:grid-cols-[1.2fr_1.2fr_0.7fr_0.5fr_0.6fr_0.5fr_0.6fr_auto]"
            >
              <div>
                <p className="text-sm font-medium">
                  {r.origin}, {r.originState}
                </p>
                {r.demo && (
                  <Badge tone="violet" className="mt-0.5">
                    Demo
                  </Badge>
                )}
              </div>
              <p className="text-sm text-ink-secondary">
                {r.destination}, {r.destState}
              </p>
              <p className="text-xs text-ink-secondary">
                {EQUIPMENT_LABEL[r.equipment as keyof typeof EQUIPMENT_LABEL] ?? r.equipment}
              </p>
              <p className="text-sm font-medium">{r.miles.toLocaleString()}</p>
              <p className="text-sm font-semibold">
                {r.rate != null ? formatCurrency(r.rate) : "—"}
              </p>
              <p className="text-xs text-ink-secondary">
                {r.ratePerMile != null ? `$${r.ratePerMile.toFixed(2)}` : "—"}
              </p>
              <p className="text-xs text-ink-secondary">{formatDate(r.pickupDate)}</p>
              <div className="flex items-center gap-1">
                {r.contactPhone && (
                  <a
                    href={`tel:${r.contactPhone}`}
                    title="Call"
                    className="rounded-lg p-1.5 text-ink-tertiary hover:bg-accent-soft hover:text-accent"
                  >
                    <Phone size={14} />
                  </a>
                )}
                <button
                  type="button"
                  title="Book"
                  onClick={() => bookLoad(r)}
                  className="rounded-lg p-1.5 text-ink-tertiary hover:bg-success-soft hover:text-success"
                >
                  <ShoppingCart size={14} />
                </button>
                <button
                  type="button"
                  title="Dismiss"
                  onClick={() => dismiss(r.id)}
                  className="rounded-lg p-1.5 text-ink-tertiary hover:bg-danger-soft hover:text-danger"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Load Modal (prefilled from board result) */}
      <CreateLoadModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          toast("success", "Load booked from board");
          setCreateOpen(false);
        }}
        initialValues={prefillValues as never}
      />

      {/* Credentials management */}
      <CredentialsModal
        open={credsOpen}
        onClose={() => setCredsOpen(false)}
        credentials={credentials}
        onRefresh={fetchCreds}
      />
    </div>
  );
}

/* ─── Credentials Modal ─── */

function CredentialsModal({
  open,
  onClose,
  credentials,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  credentials: Credential[];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ provider: "dat", username: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  async function addCred(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/tms/loadboard/credentials", {
        method: "POST",
        json: form,
      });
      toast("success", "Credential added");
      setForm({ provider: "dat", username: "", password: "" });
      setAdding(false);
      onRefresh();
    } catch (err) {
      toast("error", "Failed", (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCred(id: string) {
    try {
      await api(`/api/tms/loadboard/credentials/${id}`, { method: "DELETE" });
      toast("success", "Credential removed");
      onRefresh();
    } catch (err) {
      toast("error", "Failed", (err as Error).message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Load Board Credentials" subtitle="Manage provider logins">
      <div className="space-y-3">
        {credentials.length === 0 && !adding && (
          <p className="text-sm text-ink-secondary">No credentials configured yet.</p>
        )}
        {credentials.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl bg-surface-solid px-4 py-2.5"
          >
            <div>
              <p className="text-sm font-medium">
                {LOADBOARD_LABEL[c.provider as keyof typeof LOADBOARD_LABEL] ?? c.provider}
              </p>
              <p className="text-xs text-ink-tertiary">{c.username}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={c.active ? "success" : "neutral"}>
                {c.active ? "Active" : "Inactive"}
              </Badge>
              <button
                type="button"
                onClick={() => removeCred(c.id)}
                className="rounded-lg p-1.5 text-ink-tertiary hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {adding ? (
          <form onSubmit={addCred} className="space-y-3 rounded-xl border border-border p-4">
            <Field label="Provider">
              <Select
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              >
                {LOADBOARD_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {LOADBOARD_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Username / API Key">
              <Input
                required
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </Field>
            <Field label="Password / Secret">
              <div className="relative">
                <Input
                  required
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={saving}>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setAdding(true)}
          >
            Add credential
          </Button>
        )}
      </div>
    </Modal>
  );
}
