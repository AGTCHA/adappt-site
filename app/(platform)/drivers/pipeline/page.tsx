"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Kanban,
  List,
  Phone,
  User,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatDate, initials } from "@/src/lib/format";
import {
  ACTIVE_PIPELINE_STAGES,
  HOLD_PIPELINE_STAGE,
  PIPELINE_STAGES,
  TERMINAL_PIPELINE_STAGES,
  STAGE_LABELS,
  type PipelineStageId,
  type PipelineStageTone,
} from "@/src/lib/modules";

interface DriverRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  pipelineStage: string;
  experienceYears: number | null;
  followUpAt: string | null;
  hireSource: string;
  terminalReason: string;
}

type StageId = PipelineStageId;
type ViewMode = "kanban" | "list" | "archived";

const KANBAN_STAGES = [...ACTIVE_PIPELINE_STAGES, HOLD_PIPELINE_STAGE];

const stageRail: Record<PipelineStageTone | "neutral" | "danger", string> = {
  accent: "stage-rail-accent",
  warning: "stage-rail-warning",
  violet: "stage-rail-violet",
  success: "stage-rail-success",
  neutral: "stage-rail-neutral",
  danger: "stage-rail-danger",
};

const stageBadge: Record<PipelineStageTone | "neutral" | "danger", "accent" | "warning" | "violet" | "success" | "neutral" | "danger"> = {
  accent: "accent",
  warning: "warning",
  violet: "violet",
  success: "success",
  neutral: "neutral",
  danger: "danger",
};

function followUpDue(followUpAt: string | null) {
  if (!followUpAt) return false;
  return new Date(followUpAt).getTime() <= Date.now();
}

export default function DriverPipelinePage() {
  const toast = useToast();
  const [drivers, setDrivers] = useState<DriverRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<ViewMode>("kanban");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<StageId | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [terminalModal, setTerminalModal] = useState<{ driverId: string; stage: "denied" | "archived" } | null>(null);
  const [terminalReason, setTerminalReason] = useState("");

  const load = useCallback(() => {
    api<{ drivers: DriverRow[] }>("/api/drivers")
      .then(({ drivers: rows }) => setDrivers(rows))
      .catch(() => setFailed(true));
  }, []);

  useEffect(load, [load]);

  const activeDrivers = useMemo(
    () => (drivers ?? []).filter((d) => !["denied", "archived"].includes(d.pipelineStage)),
    [drivers]
  );

  const terminalDrivers = useMemo(
    () => (drivers ?? []).filter((d) => ["denied", "archived"].includes(d.pipelineStage)),
    [drivers]
  );

  const byStage = useMemo(() => {
    const map: Partial<Record<StageId, DriverRow[]>> = {};
    for (const stage of KANBAN_STAGES) map[stage.id] = [];
    for (const driver of activeDrivers) {
      const stage = KANBAN_STAGES.some((s) => s.id === driver.pipelineStage)
        ? (driver.pipelineStage as StageId)
        : "lead";
      map[stage]?.push(driver);
    }
    return map as Record<StageId, DriverRow[]>;
  }, [activeDrivers]);

  async function moveDriver(driverId: string, pipelineStage: StageId, reason?: string) {
    if ((pipelineStage === "denied" || pipelineStage === "archived") && !reason?.trim()) {
      setTerminalModal({ driverId, stage: pipelineStage });
      return;
    }

    setMoving(driverId);
    try {
      await api("/api/drivers/pipeline", {
        method: "PATCH",
        json: {
          updates: [{ id: driverId, pipelineStage, terminalReason: reason ?? "" }],
        },
      });
      setDrivers(
        (prev) =>
          prev?.map((d) =>
            d.id === driverId
              ? { ...d, pipelineStage, terminalReason: reason ?? d.terminalReason }
              : d
          ) ?? null
      );
      setTerminalModal(null);
      setTerminalReason("");
    } catch (error) {
      toast("error", "Couldn't move driver", (error as Error).message);
      load();
    } finally {
      setMoving(null);
    }
  }

  function adjacentStage(current: StageId, direction: -1 | 1): StageId | null {
    const stages = PIPELINE_STAGES.filter((s) => s.column !== "terminal");
    const idx = stages.findIndex((s) => s.id === current);
    const next = stages[idx + direction];
    return next?.id ?? null;
  }

  function handleDrop(stageId: StageId) {
    if (!draggingId) return;
    const driver = drivers?.find((d) => d.id === draggingId);
    if (driver && driver.pipelineStage !== stageId) {
      moveDriver(draggingId, stageId);
    }
    setDraggingId(null);
    setDropTarget(null);
  }

  function DriverCard({ driver, stageId }: { driver: DriverRow; stageId?: StageId }) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: moving === driver.id ? 0.6 : 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        draggable={view === "kanban"}
        onDragStart={() => setDraggingId(driver.id)}
        onDragEnd={() => {
          setDraggingId(null);
          setDropTarget(null);
        }}
        className={`glass-raised rounded-xl border border-border/80 p-3 shadow-sm ${
          view === "kanban" ? "cursor-grab active:cursor-grabbing" : ""
        } ${draggingId === driver.id ? "opacity-50" : ""}`}
      >
        <div className="flex items-start gap-2">
          {view === "kanban" && (
            <GripVertical size={14} className="mt-0.5 shrink-0 text-ink-tertiary" />
          )}
          <div className="min-w-0 flex-1">
            <Link href={`/drivers/${driver.id}`} className="focus-ring flex items-center gap-2 rounded-lg">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {initials(driver.firstName, driver.lastName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {driver.firstName} {driver.lastName}
                </p>
                {driver.phone ? (
                  <p className="flex items-center gap-1 truncate text-xs text-ink-secondary">
                    <Phone size={10} />
                    {driver.phone}
                  </p>
                ) : null}
              </div>
            </Link>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {driver.hireSource ? (
                <Badge tone="neutral" className="!text-[10px]">
                  {driver.hireSource}
                </Badge>
              ) : null}
              {followUpDue(driver.followUpAt) && (
                <Badge tone="warning" className="!text-[10px]">
                  <Clock size={9} />
                  Follow up
                </Badge>
              )}
            </div>
            {driver.experienceYears != null && (
              <p className="mt-1 text-[11px] font-medium text-ink-tertiary">
                {driver.experienceYears} yrs experience
              </p>
            )}
          </div>
        </div>
        {stageId && view === "kanban" && (
          <div className="mt-2.5 flex justify-between gap-1 border-t border-border/60 pt-2">
            {adjacentStage(stageId, -1) && (
              <button
                type="button"
                disabled={moving === driver.id}
                onClick={() => moveDriver(driver.id, adjacentStage(stageId, -1)!)}
                className="focus-ring flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-secondary hover:bg-accent-soft hover:text-ink"
              >
                <ChevronLeft size={12} />
                Back
              </button>
            )}
            <span className="flex-1" />
            {adjacentStage(stageId, 1) && (
              <button
                type="button"
                disabled={moving === driver.id}
                onClick={() => moveDriver(driver.id, adjacentStage(stageId, 1)!)}
                className="focus-ring flex items-center gap-0.5 rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent hover:text-accent-text"
              >
                Advance
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Hiring Pipeline"
        subtitle="Six active stages plus hold — deny or archive with a reason."
        actions={
          <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
            {(
              [
                { key: "kanban", icon: Kanban, label: "Board" },
                { key: "list", icon: List, label: "List" },
                { key: "archived", icon: Archive, label: "Archived" },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`focus-ring flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  view === key ? "bg-accent text-accent-text" : "text-ink-secondary hover:bg-accent-soft"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        }
      />

      {failed ? (
        <EmptyState
          icon={<Kanban size={24} />}
          title="Couldn't load pipeline"
          description="Something went wrong. Refresh the page to try again."
        />
      ) : drivers === null ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[min(70vh,560px)] rounded-2xl" />
          ))}
        </div>
      ) : view === "archived" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {TERMINAL_PIPELINE_STAGES.map((stage) => {
            const rows = terminalDrivers.filter((d) => d.pipelineStage === stage.id);
            return (
              <div key={stage.id} className={`glass rounded-2xl p-4 ${stageRail[stage.tone]}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge tone={stageBadge[stage.tone]}>{rows.length}</Badge>
                </div>
                <div className="space-y-2">
                  {rows.length === 0 ? (
                    <p className="py-6 text-center text-xs text-ink-tertiary">None</p>
                  ) : (
                    rows.map((driver) => (
                      <div key={driver.id} className="glass-raised rounded-xl p-3">
                        <Link href={`/drivers/${driver.id}`} className="text-sm font-semibold hover:text-accent">
                          {driver.firstName} {driver.lastName}
                        </Link>
                        {driver.terminalReason && (
                          <p className="mt-1 text-xs text-ink-secondary">{driver.terminalReason}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === "list" ? (
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-tertiary">
                <th className="px-4 py-3 font-semibold">Driver</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Follow up</th>
              </tr>
            </thead>
            <tbody>
              {activeDrivers.map((driver) => (
                <tr key={driver.id} className="border-b border-border/60 hover:bg-accent-soft/30">
                  <td className="px-4 py-3">
                    <Link href={`/drivers/${driver.id}`} className="font-medium hover:text-accent">
                      {driver.firstName} {driver.lastName}
                    </Link>
                    {driver.phone && (
                      <p className="text-xs text-ink-tertiary">{driver.phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="accent">{STAGE_LABELS[driver.pipelineStage] ?? driver.pipelineStage}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{driver.hireSource || "—"}</td>
                  <td className="px-4 py-3 text-ink-secondary">
                    {driver.followUpAt ? formatDate(driver.followUpAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4 xl:grid-cols-3">
          {KANBAN_STAGES.map((stage, colIndex) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.04, type: "spring", stiffness: 280, damping: 26 }}
              className={`glass flex min-h-[min(65vh,520px)] flex-col overflow-hidden rounded-2xl transition-shadow ${
                stageRail[stage.tone]
              } ${dropTarget === stage.id ? "ring-2 ring-accent shadow-raised" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(stage.id);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(stage.id);
              }}
            >
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-ink">{stage.label}</h3>
                  <p className="mt-0.5 text-xs text-ink-secondary">
                    {byStage[stage.id]?.length ?? 0} driver
                    {(byStage[stage.id]?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge tone={stageBadge[stage.tone]}>{byStage[stage.id]?.length ?? 0}</Badge>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto border-t border-border/70 px-3 py-3">
                <AnimatePresence mode="popLayout">
                  {(byStage[stage.id]?.length ?? 0) === 0 ? (
                    <p className="px-2 py-10 text-center text-xs text-ink-tertiary">Drop drivers here</p>
                  ) : (
                    byStage[stage.id]?.map((driver) => (
                      <DriverCard key={driver.id} driver={driver} stageId={stage.id} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {drivers && drivers.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<User size={24} />}
            title="Pipeline is empty"
            description="Add drivers from the Drivers page or convert leads from Job Ads."
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const id = draggingId ?? drivers?.[0]?.id;
            if (id) moveDriver(id, "denied");
          }}
        >
          Deny selected
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const id = draggingId ?? drivers?.[0]?.id;
            if (id) moveDriver(id, "archived");
          }}
        >
          Archive
        </Button>
      </div>

      <Modal
        open={Boolean(terminalModal)}
        onClose={() => {
          setTerminalModal(null);
          setTerminalReason("");
        }}
        title={terminalModal?.stage === "denied" ? "Deny applicant" : "Archive applicant"}
        subtitle="A reason is required for terminal moves."
      >
        <Field label="Reason">
          <Textarea
            value={terminalReason}
            onChange={(e) => setTerminalReason(e.target.value)}
            placeholder="Doesn't meet experience requirements…"
          />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setTerminalModal(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!terminalReason.trim()}
            onClick={() => {
              if (terminalModal) {
                moveDriver(terminalModal.driverId, terminalModal.stage, terminalReason);
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
