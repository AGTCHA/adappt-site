"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatRelative } from "@/src/lib/format";

interface DocRow {
  id: string;
  fileName: string;
  mimeType: string;
  status: string;
  createdAt: string;
  truck: { id: string; unitNumber: string } | null;
  workOrder: { id: string; title: string; woNumber: string } | null;
}

const statusTone: Record<string, "accent" | "warning" | "success" | "neutral" | "danger" | "violet"> = {
  pending: "warning",
  reviewed: "violet",
  applied: "success",
  rejected: "neutral",
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read file"));
    reader.readAsDataURL(file);
  });
}

export default function DocumentsPage() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    const qs = filter ? `?status=${filter}` : "";
    api<{ documents: DocRow[] }>(`/api/maintenance/documents${qs}`)
      .then(({ documents }) => setDocs(documents))
      .catch(() => setDocs([]));
  }, [filter]);

  useEffect(load, [load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await readFileAsDataUrl(file);
        await api("/api/maintenance/documents", {
          method: "POST",
          json: {
            fileName: file.name,
            mimeType: file.type || "application/pdf",
            dataUrl,
          },
        });
      }
      toast("success", "Invoice uploaded", "Review extracted fields, then apply to a work order.");
      load();
    } catch (error) {
      toast("error", "Upload failed", (error as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance"
        title="Documents"
        subtitle="Upload invoices — AI extracts fields, you review, then apply to a work order."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <Button
              icon={<Upload size={15} />}
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              Upload invoice
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {["", "pending", "reviewed", "applied", "rejected"].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setFilter(s)}
            className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === s
                ? "bg-accent text-accent-text"
                : "bg-surface-solid text-ink-secondary ring-1 ring-border"
            }`}
          >
            {s === "" ? "All" : s}
          </button>
        ))}
      </div>

      {docs === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No invoices yet"
          description="Drop a PDF or photo of a shop invoice to start the review → work-order pipeline."
        />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <Link
              key={doc.id}
              href={`/maintenance/documents/${doc.id}`}
              className="glass focus-ring flex items-center gap-4 rounded-2xl px-4 py-3.5 hover:shadow-raised"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-soft text-violet">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-ink">{doc.fileName}</p>
                  <Badge tone={statusTone[doc.status] ?? "neutral"}>{doc.status}</Badge>
                </div>
                <p className="text-xs text-ink-secondary">
                  {doc.truck ? `Unit ${doc.truck.unitNumber}` : "No unit matched"}
                  {doc.workOrder
                    ? ` · ${doc.workOrder.woNumber || "WO"} ${doc.workOrder.title}`
                    : ""}
                  {" · "}
                  {formatRelative(doc.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
