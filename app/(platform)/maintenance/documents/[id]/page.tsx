"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, RefreshCw } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

interface DocDetail {
  id: string;
  fileName: string;
  status: string;
  extracted: string;
  truck: { id: string; unitNumber: string } | null;
  workOrder: { id: string; title: string; woNumber: string; status: string } | null;
}

export default function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [trucks, setTrucks] = useState<{ id: string; unitNumber: string }[]>([]);
  const [applying, setApplying] = useState(false);
  const [truckId, setTruckId] = useState("");
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");
  const [description, setDescription] = useState("");
  const [linesText, setLinesText] = useState("");

  const extracted = useMemo(() => {
    if (!doc?.extracted) return {} as Record<string, unknown>;
    try {
      return JSON.parse(doc.extracted) as Record<string, unknown>;
    } catch {
      return {};
    }
  }, [doc]);

  const load = useCallback(() => {
    api<{ document: DocDetail }>(`/api/maintenance/documents/${id}`)
      .then(({ document }) => {
        setDoc(document);
        setTruckId(document.truck?.id ?? "");
        try {
          const ex = document.extracted
            ? (JSON.parse(document.extracted) as Record<string, unknown>)
            : {};
          setVendor(String(ex.vendor ?? ""));
          setAmount(ex.amount != null ? String(ex.amount) : "");
          setOdometer(ex.odometer != null ? String(ex.odometer) : "");
          setDescription(String(ex.description ?? ""));
          setTitle(String(ex.description ?? ex.invoiceNumber ?? "Invoice work order"));
          const items = Array.isArray(ex.lineItems) ? ex.lineItems : [];
          if (items.length) {
            setLinesText(
              items
                .map(
                  (li: { description?: string; amount?: number }) =>
                    `${li.description ?? "Line"}|${li.amount ?? 0}`
                )
                .join("\n")
            );
          } else if (ex.amount != null) {
            setLinesText(`${ex.description ?? "Invoice"}|${ex.amount}`);
          }
        } catch {
          /* ignore */
        }
      })
      .catch(() => setDoc(null));
  }, [id]);

  useEffect(load, [load]);

  useEffect(() => {
    api<{ trucks: { id: string; unitNumber: string }[] }>("/api/trucks")
      .then(({ trucks: rows }) => setTrucks(rows))
      .catch(() => setTrucks([]));
  }, []);

  async function reextract() {
    try {
      await api(`/api/maintenance/documents/${id}`, {
        method: "PATCH",
        json: { action: "reextract" },
      });
      toast("success", "Re-extracted");
      load();
    } catch (error) {
      toast("error", "Re-extract failed", (error as Error).message);
    }
  }

  async function apply() {
    setApplying(true);
    try {
      const lines = linesText
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean)
        .map((row) => {
          const [descriptionPart, amountPart] = row.split("|");
          return {
            description: (descriptionPart ?? "Line").trim(),
            amount: Number(amountPart) || 0,
          };
        });

      const { workOrder } = await api<{ workOrder: { id: string } }>(
        `/api/maintenance/documents/${id}`,
        {
          method: "PATCH",
          json: {
            action: "apply",
            truckId,
            title,
            vendor,
            lines,
            extracted: {
              ...extracted,
              vendor,
              amount: Number(amount) || 0,
              odometer: odometer ? Number(odometer) : null,
              description,
            },
          },
        }
      );
      toast("success", "Applied to work order");
      router.push(`/maintenance/work-orders/${workOrder.id}`);
    } catch (error) {
      toast("error", "Couldn't apply", (error as Error).message);
    } finally {
      setApplying(false);
    }
  }

  if (!doc) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  const applied = doc.status === "applied";

  return (
    <div>
      <Link
        href="/maintenance/documents"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-accent"
      >
        <ArrowLeft size={14} /> Documents
      </Link>

      <PageHeader
        eyebrow="Invoice review"
        title={doc.fileName}
        subtitle="Confirm truck, vendor, and lines — then create the work order."
        actions={
          <>
            <Badge tone="violet">{doc.status}</Badge>
            {!applied && (
              <>
                <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={reextract}>
                  Re-extract
                </Button>
                <Button icon={<Check size={15} />} loading={applying} onClick={apply}>
                  Apply to work order
                </Button>
              </>
            )}
            {doc.workOrder && (
              <Link href={`/maintenance/work-orders/${doc.workOrder.id}`}>
                <Button variant="secondary">Open {doc.workOrder.woNumber || "WO"}</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <Field label="Truck">
            <Select
              disabled={applied}
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
            >
              <option value="">Select unit…</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  Unit {t.unitNumber}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Work order title">
            <Input disabled={applied} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Vendor">
            <Input disabled={applied} value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <Input
                disabled={applied}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Odometer">
              <Input
                disabled={applied}
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Description">
            <Input
              disabled={applied}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </Card>

        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold">Line items</h2>
          <p className="mb-3 text-xs text-ink-tertiary">
            One per line as <code className="text-accent">description|amount</code>
          </p>
          <textarea
            disabled={applied}
            className="input min-h-56 font-mono text-xs"
            value={linesText}
            onChange={(e) => setLinesText(e.target.value)}
          />
        </Card>
      </div>
    </div>
  );
}
