"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  Link2,
  MapPin,
  MessageSquare,
  Package,
  Play,
  RotateCcw,
  Send,
  Trash2,
  Truck,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";
import {
  DOC_TYPES,
  DOC_TYPE_LABEL,
  EQUIPMENT_LABEL,
  EQUIPMENT_TYPES,
  LOAD_STATUS_LABEL,
  LOAD_TRANSITIONS,
  normalizeLoadStatus,
  type LoadStatus,
} from "@/src/lib/tms/constants";

interface StopData {
  id: string;
  type: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  appointment: string | null;
  instructions: string | null;
}

interface DocData {
  id: string;
  type: string;
  fileName: string;
  url: string | null;
  createdAt: string;
}

interface RateConData {
  id: string;
  sentAt: string;
  signedAt: string | null;
  signatureUrl: string | null;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface LoadDetail {
  id: string;
  loadNumber: string;
  status: string;
  customerName: string;
  customerId: string | null;
  billTo: string | null;
  refBol: string | null;
  refPo: string | null;
  refPro: string | null;
  rate: number | null;
  linehaul: number | null;
  fsc: number | null;
  accessorials: number | null;
  miles: number | null;
  loadedMiles: number | null;
  emptyMiles: number | null;
  equipment: string | null;
  commodity: string | null;
  weight: number | null;
  pieces: number | null;
  pallets: number | null;
  hazmat: boolean;
  reeferTempMin: number | null;
  reeferTempMax: number | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  notes: string | null;
  trackingLink: string | null;
  driver: { id: string; firstName: string; lastName: string } | null;
  truck: { id: string; unitNumber: string } | null;
  trailer: { id: string; unitNumber: string } | null;
  stops: StopData[];
  documents: DocData[];
  rateCons: RateConData[];
  invoices: InvoiceData[];
  driverPay: number | null;
  createdAt: string;
  updatedAt: string;
}

const statusTone: Record<string, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  pending: "accent",
  assigned: "warning",
  in_transit: "warning",
  delivered: "success",
  cancelled: "neutral",
};

export default function LoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [rateConOpen, setRateConOpen] = useState(false);
  const [invoiceGenerating, setInvoiceGenerating] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLoad = useCallback(() => {
    setLoading(true);
    api<LoadDetail>(`/api/tms/loads/${id}`)
      .then((data) => {
        setLoad(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast("error", "Failed to load");
      });
  }, [id, toast]);

  useEffect(fetchLoad, [fetchLoad]);

  async function transition(status: string) {
    setTransitioning(true);
    try {
      await api(`/api/tms/loads/${id}`, {
        method: "PATCH",
        json: { action: "transition", status },
      });
      toast("success", `Status → ${LOAD_STATUS_LABEL[status as LoadStatus] ?? status}`);
      fetchLoad();
    } catch (err) {
      toast("error", "Transition failed", (err as Error).message);
    } finally {
      setTransitioning(false);
    }
  }

  async function generateTrackingLink() {
    try {
      const res = await api<{ trackingLink: string }>(`/api/tms/loads/${id}`, {
        method: "PATCH",
        json: { action: "tracking_link" },
      });
      toast("success", "Tracking link generated");
      setLoad((prev) => (prev ? { ...prev, trackingLink: res.trackingLink } : prev));
    } catch (err) {
      toast("error", "Failed", (err as Error).message);
    }
  }

  async function generateInvoice() {
    setInvoiceGenerating(true);
    try {
      await api("/api/tms/invoices", { method: "POST", json: { loadId: id } });
      toast("success", "Invoice generated");
      fetchLoad();
    } catch (err) {
      toast("error", "Invoice failed", (err as Error).message);
    } finally {
      setInvoiceGenerating(false);
    }
  }

  async function deleteLoad() {
    setDeleting(true);
    try {
      await api(`/api/tms/loads/${id}`, { method: "DELETE" });
      toast("success", "Load deleted");
      router.push("/tms/loads");
    } catch (err) {
      toast("error", "Delete failed", (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="py-16 text-center text-ink-secondary">
        <p>Load not found.</p>
        <Link href="/tms/loads" className="mt-4 inline-block text-accent hover:underline">
          ← Back to loads
        </Link>
      </div>
    );
  }

  const normalized = normalizeLoadStatus(load.status);
  const transitions = LOAD_TRANSITIONS[normalized] ?? [];
  const margin =
    load.rate != null && load.driverPay != null ? load.rate - load.driverPay : null;
  const marginPct =
    margin != null && load.rate ? ((margin / load.rate) * 100).toFixed(1) : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/tms/loads"
          className="focus-ring rounded-lg p-2 text-ink-tertiary hover:bg-accent-soft hover:text-ink"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{load.loadNumber}</h1>
            <Badge tone={statusTone[normalized] ?? "neutral"}>
              {LOAD_STATUS_LABEL[normalized] ?? load.status}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-secondary">
            {load.customerName || "No customer"} · Created {formatDate(load.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit size={14} />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          {transitions.map((t) => {
            const labels: Record<string, { label: string; icon: React.ReactNode; variant: "primary" | "secondary" | "success" | "danger" }> = {
              in_transit: { label: "Start Route", icon: <Play size={14} />, variant: "primary" },
              delivered: { label: "Mark Delivered", icon: <CheckCircle size={14} />, variant: "success" },
              assigned: { label: "Assign", icon: <Truck size={14} />, variant: "secondary" },
              pending: { label: "Reactivate", icon: <RotateCcw size={14} />, variant: "secondary" },
              cancelled: { label: "Cancel", icon: <XCircle size={14} />, variant: "danger" },
            };
            const cfg = labels[t] ?? { label: LOAD_STATUS_LABEL[t], icon: null, variant: "secondary" as const };
            return (
              <Button
                key={t}
                variant={cfg.variant}
                size="sm"
                icon={cfg.icon}
                loading={transitioning}
                onClick={() => transition(t)}
              >
                {cfg.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Route */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MapPin size={15} className="text-accent" /> Route
          </h3>
          {load.stops.length === 0 ? (
            <p className="text-sm text-ink-secondary">No stops defined.</p>
          ) : (
            <div className="space-y-3">
              {load.stops.map((stop, idx) => (
                <div key={stop.id || idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        stop.type === "pickup"
                          ? "bg-accent-soft text-accent"
                          : stop.type === "delivery"
                          ? "bg-success-soft text-success"
                          : "bg-border text-ink-tertiary"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {idx < load.stops.length - 1 && (
                      <div className="mt-1 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-3">
                    <p className="text-sm font-medium">
                      {stop.city}, {stop.state} {stop.zip}
                    </p>
                    {stop.address && (
                      <p className="text-xs text-ink-secondary">{stop.address}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-tertiary">
                      <Badge tone={stop.type === "pickup" ? "accent" : stop.type === "delivery" ? "success" : "neutral"}>
                        {stop.type}
                      </Badge>
                      {stop.appointment && <span>Appt: {formatDate(stop.appointment)}</span>}
                    </div>
                    {stop.instructions && (
                      <p className="mt-1 text-xs text-ink-tertiary italic">{stop.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Assignment */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Truck size={15} className="text-accent" /> Assignment
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Driver</span>
              <span className="font-medium">
                {load.driver
                  ? `${load.driver.firstName} ${load.driver.lastName}`
                  : "Unassigned"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Truck</span>
              <span className="font-medium">
                {load.truck ? `Unit ${load.truck.unitNumber}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Trailer</span>
              <span className="font-medium">
                {load.trailer ? `Unit ${load.trailer.unitNumber}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Equipment</span>
              <span className="font-medium">
                {load.equipment ? EQUIPMENT_LABEL[load.equipment as keyof typeof EQUIPMENT_LABEL] ?? load.equipment : "—"}
              </span>
            </div>
          </div>
        </Card>

        {/* Economics */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <DollarSign size={15} className="text-accent" /> Economics
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Linehaul</span>
              <span className="font-medium">{load.linehaul != null ? formatCurrency(load.linehaul) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">FSC</span>
              <span className="font-medium">{load.fsc != null ? formatCurrency(load.fsc) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Accessorials</span>
              <span className="font-medium">{load.accessorials != null ? formatCurrency(load.accessorials) : "—"}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">Total Revenue</span>
              <span className="font-semibold text-accent">
                {load.rate != null ? formatCurrency(load.rate) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Driver Pay</span>
              <span className="font-medium">{load.driverPay != null ? formatCurrency(load.driverPay) : "—"}</span>
            </div>
            {margin != null && (
              <div className="flex justify-between">
                <span className="text-ink-secondary">Margin</span>
                <span className="font-medium text-success">
                  {formatCurrency(margin)} ({marginPct}%)
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-ink-secondary">Loaded / Empty Miles</span>
              <span className="font-medium">
                {load.loadedMiles ?? "—"} / {load.emptyMiles ?? "—"}
              </span>
            </div>
            {load.miles && load.rate && (
              <div className="flex justify-between">
                <span className="text-ink-secondary">RPM</span>
                <span className="font-medium">${(load.rate / load.miles).toFixed(2)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Freight */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Package size={15} className="text-accent" /> Freight
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Commodity</span>
              <span className="font-medium">{load.commodity || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Weight</span>
              <span className="font-medium">{load.weight ? `${load.weight.toLocaleString()} lbs` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Pieces / Pallets</span>
              <span className="font-medium">{load.pieces ?? "—"} / {load.pallets ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Hazmat</span>
              <span className="font-medium">{load.hazmat ? "Yes" : "No"}</span>
            </div>
            {load.equipment === "reefer" && (
              <div className="flex justify-between">
                <span className="text-ink-secondary">Temp range</span>
                <span className="font-medium">
                  {load.reeferTempMin ?? "—"}°F – {load.reeferTempMax ?? "—"}°F
                </span>
              </div>
            )}
            {load.refBol && (
              <div className="flex justify-between">
                <span className="text-ink-secondary">BOL</span>
                <span className="font-medium">{load.refBol}</span>
              </div>
            )}
            {load.refPo && (
              <div className="flex justify-between">
                <span className="text-ink-secondary">PO</span>
                <span className="font-medium">{load.refPo}</span>
              </div>
            )}
            {load.refPro && (
              <div className="flex justify-between">
                <span className="text-ink-secondary">PRO</span>
                <span className="font-medium">{load.refPro}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Documents */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={15} className="text-accent" /> Documents
            </h3>
            <Button
              variant="ghost"
              size="sm"
              icon={<Upload size={13} />}
              onClick={() => setDocUploadOpen(true)}
            >
              Upload
            </Button>
          </div>
          {load.documents.length === 0 ? (
            <p className="text-sm text-ink-secondary">No documents yet.</p>
          ) : (
            <div className="space-y-2">
              {load.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl bg-surface-solid px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{doc.fileName}</p>
                    <p className="text-xs text-ink-tertiary">
                      {DOC_TYPE_LABEL[doc.type as keyof typeof DOC_TYPE_LABEL] ?? doc.type} ·{" "}
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-ink-tertiary hover:text-accent"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Rate Confirmations */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Send size={15} className="text-accent" /> Rate Confirmations
            </h3>
            <Button
              variant="ghost"
              size="sm"
              icon={<Send size={13} />}
              onClick={() => setRateConOpen(true)}
            >
              Send
            </Button>
          </div>
          {load.rateCons.length === 0 ? (
            <p className="text-sm text-ink-secondary">No rate cons sent.</p>
          ) : (
            <div className="space-y-2">
              {load.rateCons.map((rc) => (
                <div
                  key={rc.id}
                  className="flex items-center justify-between rounded-xl bg-surface-solid px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">Sent {formatDate(rc.sentAt)}</p>
                    {rc.signedAt && (
                      <p className="text-xs text-success">Signed {formatDate(rc.signedAt)}</p>
                    )}
                  </div>
                  <Badge tone={rc.signedAt ? "success" : "warning"}>
                    {rc.signedAt ? "Signed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Invoice */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={15} className="text-accent" /> Invoices
            </h3>
            <Button
              variant="ghost"
              size="sm"
              icon={<DollarSign size={13} />}
              loading={invoiceGenerating}
              onClick={generateInvoice}
            >
              Generate
            </Button>
          </div>
          {load.invoices.length === 0 ? (
            <p className="text-sm text-ink-secondary">No invoices generated.</p>
          ) : (
            <div className="space-y-2">
              {load.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl bg-surface-solid px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-ink-tertiary">
                      {formatCurrency(inv.amount)} · {formatDate(inv.createdAt)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      inv.status === "paid"
                        ? "success"
                        : inv.status === "disputed"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tracking */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Link2 size={15} className="text-accent" /> Tracking
          </h3>
          {load.trackingLink ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={load.trackingLink}
                className="input flex-1 text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(load.trackingLink!);
                  toast("success", "Copied!");
                }}
                className="rounded-lg p-2 text-ink-tertiary hover:text-accent"
              >
                <Copy size={14} />
              </button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" icon={<Link2 size={13} />} onClick={generateTrackingLink}>
              Generate tracking link
            </Button>
          )}
        </Card>

        {/* Notes */}
        {load.notes && (
          <Card className="p-5 lg:col-span-2">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <MessageSquare size={15} className="text-accent" /> Notes
            </h3>
            <p className="whitespace-pre-wrap text-sm text-ink-secondary">{load.notes}</p>
          </Card>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-8 flex justify-end">
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => setDeleteOpen(true)}
        >
          Delete load
        </Button>
      </div>

      {/* Delete confirmation */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Load">
        <p className="text-sm text-ink-secondary">
          Are you sure you want to delete <strong>{load.loadNumber}</strong>? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={deleteLoad}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <EditLoadModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        load={load}
        onSaved={fetchLoad}
      />

      {/* Document Upload Modal */}
      <DocUploadModal
        open={docUploadOpen}
        onClose={() => setDocUploadOpen(false)}
        loadId={id}
        onUploaded={fetchLoad}
      />

      {/* Rate Con Send Modal */}
      <RateConSendModal
        open={rateConOpen}
        onClose={() => setRateConOpen(false)}
        loadId={id}
        onSent={fetchLoad}
      />
    </div>
  );
}

/* ─── Edit Load Modal ─── */

function EditLoadModal({
  open,
  onClose,
  load,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  load: LoadDetail;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: load.customerName,
    rate: load.rate?.toString() ?? "",
    linehaul: load.linehaul?.toString() ?? "",
    fsc: load.fsc?.toString() ?? "",
    accessorials: load.accessorials?.toString() ?? "",
    miles: load.miles?.toString() ?? "",
    loadedMiles: load.loadedMiles?.toString() ?? "",
    emptyMiles: load.emptyMiles?.toString() ?? "",
    equipment: load.equipment ?? "dry_van",
    commodity: load.commodity ?? "",
    weight: load.weight?.toString() ?? "",
    notes: load.notes ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        customerName: load.customerName,
        rate: load.rate?.toString() ?? "",
        linehaul: load.linehaul?.toString() ?? "",
        fsc: load.fsc?.toString() ?? "",
        accessorials: load.accessorials?.toString() ?? "",
        miles: load.miles?.toString() ?? "",
        loadedMiles: load.loadedMiles?.toString() ?? "",
        emptyMiles: load.emptyMiles?.toString() ?? "",
        equipment: load.equipment ?? "dry_van",
        commodity: load.commodity ?? "",
        weight: load.weight?.toString() ?? "",
        notes: load.notes ?? "",
      });
    }
  }, [open, load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/tms/loads/${load.id}`, {
        method: "PATCH",
        json: {
          action: "update",
          customerName: form.customerName,
          rate: form.rate ? Number(form.rate) : undefined,
          linehaul: form.linehaul ? Number(form.linehaul) : undefined,
          fsc: form.fsc ? Number(form.fsc) : undefined,
          accessorials: form.accessorials ? Number(form.accessorials) : undefined,
          miles: form.miles ? Number(form.miles) : undefined,
          loadedMiles: form.loadedMiles ? Number(form.loadedMiles) : undefined,
          emptyMiles: form.emptyMiles ? Number(form.emptyMiles) : undefined,
          equipment: form.equipment,
          commodity: form.commodity || undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          notes: form.notes || undefined,
        },
      });
      toast("success", "Load updated");
      onSaved();
      onClose();
    } catch (err) {
      toast("error", "Update failed", (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Load" wide>
      <form onSubmit={save} className="space-y-4">
        <Field label="Customer">
          <Input
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Linehaul ($)">
            <Input
              type="number"
              step="0.01"
              value={form.linehaul}
              onChange={(e) => setForm((f) => ({ ...f, linehaul: e.target.value }))}
            />
          </Field>
          <Field label="FSC ($)">
            <Input
              type="number"
              step="0.01"
              value={form.fsc}
              onChange={(e) => setForm((f) => ({ ...f, fsc: e.target.value }))}
            />
          </Field>
          <Field label="Accessorials ($)">
            <Input
              type="number"
              step="0.01"
              value={form.accessorials}
              onChange={(e) => setForm((f) => ({ ...f, accessorials: e.target.value }))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Loaded miles">
            <Input
              type="number"
              value={form.loadedMiles}
              onChange={(e) => setForm((f) => ({ ...f, loadedMiles: e.target.value }))}
            />
          </Field>
          <Field label="Empty miles">
            <Input
              type="number"
              value={form.emptyMiles}
              onChange={(e) => setForm((f) => ({ ...f, emptyMiles: e.target.value }))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Equipment">
            <Select
              value={form.equipment}
              onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
            >
              {EQUIPMENT_TYPES.map((eq) => (
                <option key={eq} value={eq}>
                  {EQUIPMENT_LABEL[eq]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Weight (lbs)">
            <Input
              type="number"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Commodity">
          <Input
            value={form.commodity}
            onChange={(e) => setForm((f) => ({ ...f, commodity: e.target.value }))}
          />
        </Field>
        <Field label="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Document Upload Modal ─── */

function DocUploadModal({
  open,
  onClose,
  loadId,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  loadId: string;
  onUploaded: () => void;
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<string>("bol");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await api("/api/tms/documents", {
        method: "POST",
        json: {
          loadId,
          type: docType,
          fileName: file.name,
          data: base64,
          mimeType: file.type,
        },
      });
      toast("success", "Document uploaded");
      onUploaded();
      onClose();
    } catch (err) {
      toast("error", "Upload failed", (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Document">
      <form onSubmit={upload} className="space-y-4">
        <Field label="Document type">
          <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((dt) => (
              <option key={dt} value={dt}>
                {DOC_TYPE_LABEL[dt]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="File">
          <input
            ref={fileRef}
            type="file"
            required
            className="text-sm text-ink-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={uploading}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Rate Con Send Modal ─── */

function RateConSendModal({
  open,
  onClose,
  loadId,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  loadId: string;
  onSent: () => void;
}) {
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api("/api/tms/rate-cons", {
        method: "POST",
        json: { loadId, recipientEmail: email || undefined },
      });
      toast("success", "Rate confirmation sent");
      onSent();
      onClose();
      setEmail("");
    } catch (err) {
      toast("error", "Send failed", (err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Send Rate Confirmation">
      <form onSubmit={send} className="space-y-4">
        <Field label="Recipient email (optional)">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="driver@example.com"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={sending} icon={<Send size={14} />}>
            Send
          </Button>
        </div>
      </form>
    </Modal>
  );
}
