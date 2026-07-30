"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

interface HireSource {
  id: string;
  name: string;
  active: boolean;
}

export default function HireSourcesPage() {
  const toast = useToast();
  const [sources, setSources] = useState<HireSource[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api<{ sources: HireSource[] }>("/api/hire-sources")
      .then(({ sources: rows }) => setSources(rows))
      .catch(() => setSources([]));
  }, []);

  useEffect(load, [load]);

  async function createSource(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api("/api/hire-sources", { method: "POST", json: { name: name.trim() } });
      toast("success", "Hire source added");
      setName("");
      setModalOpen(false);
      load();
    } catch (error) {
      toast("error", "Couldn't add", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(source: HireSource) {
    try {
      await api(`/api/hire-sources/${source.id}`, {
        method: "PATCH",
        json: { active: !source.active },
      });
      load();
    } catch (error) {
      toast("error", "Update failed", (error as Error).message);
    }
  }

  async function removeSource(id: string) {
    try {
      await api(`/api/hire-sources/${id}`, { method: "DELETE" });
      toast("success", "Removed");
      load();
    } catch (error) {
      toast("error", "Delete failed", (error as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Hire Sources"
        subtitle="Track where applicants come from — used on driver profiles and analytics."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
            Add source
          </Button>
        }
      />

      {!sources ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <EmptyState
          icon={<Target size={24} />}
          title="No hire sources yet"
          description="Add sources like Referral, Indeed, Walk-in, or Driver Referral."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
              Add source
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{source.name}</span>
                <Badge tone={source.active ? "success" : "neutral"}>
                  {source.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => toggleActive(source)}>
                  {source.active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 size={14} />}
                  onClick={() => removeSource(source.id)}
                  className="text-danger hover:bg-danger-soft"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add hire source">
        <form onSubmit={createSource} className="space-y-4">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Referral, Indeed, Walk-in…"
              autoFocus
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
