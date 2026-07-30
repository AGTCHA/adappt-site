import { prisma } from "./prisma";

export async function nextWoNumber(companyId: string): Promise<string> {
  const count = await prisma.workOrder.count({ where: { companyId } });
  return `WO-${String(count + 1).padStart(5, "0")}`;
}

export function computeNextDue(params: {
  completedAt: Date;
  mileage: number;
  intervalMiles: number | null | undefined;
  intervalDays: number | null | undefined;
}): { nextDueAt: Date | null; nextDueMiles: number | null } {
  const nextDueAt =
    params.intervalDays != null && params.intervalDays > 0
      ? new Date(params.completedAt.getTime() + params.intervalDays * 86_400_000)
      : null;
  const nextDueMiles =
    params.intervalMiles != null && params.intervalMiles > 0
      ? params.mileage + params.intervalMiles
      : null;
  return { nextDueAt, nextDueMiles };
}

export type ProgramHealth = "overdue" | "due_soon" | "ok" | "unknown";

export function programHealth(program: {
  nextDueAt: Date | string | null;
  nextDueMiles: number | null;
  truck?: { mileage: number } | null;
}): ProgramHealth {
  const mileage = program.truck?.mileage ?? null;
  let overdue = false;
  let dueSoon = false;

  if (program.nextDueMiles != null && mileage != null) {
    if (mileage >= program.nextDueMiles) overdue = true;
    else if (mileage >= program.nextDueMiles - 1000) dueSoon = true;
  }

  if (program.nextDueAt) {
    const due = new Date(program.nextDueAt).getTime();
    const now = Date.now();
    if (due <= now) overdue = true;
    else if (due <= now + 14 * 86_400_000) dueSoon = true;
  }

  if (program.nextDueAt == null && program.nextDueMiles == null) return "unknown";
  if (overdue) return "overdue";
  if (dueSoon) return "due_soon";
  return "ok";
}

/** Complete a work order and apply side effects (record, odometer, PM). */
export async function completeWorkOrder(
  companyId: string,
  workOrderId: string,
  opts: { odometer?: number | null; createRecord?: boolean } = {}
) {
  const wo = await prisma.workOrder.findFirst({
    where: { id: workOrderId, companyId },
    include: {
      lines: true,
      vendor: true,
      truck: true,
    },
  });
  if (!wo) throw new Error("Work order not found");

  const completedAt = new Date();
  const odometer =
    opts.odometer != null && Number.isFinite(Number(opts.odometer))
      ? Number(opts.odometer)
      : wo.odometer;

  const updated = await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.update({
      where: { id: wo.id },
      data: {
        status: "completed",
        completedAt,
        odometer: odometer ?? wo.odometer,
      },
      include: {
        truck: { select: { id: true, unitNumber: true } },
        vendor: { select: { id: true, name: true } },
        lines: true,
      },
    });

    if (odometer != null) {
      await tx.truck.update({
        where: { id: wo.truckId },
        data: { mileage: odometer, status: "active" },
      });
      await tx.odometerSnapshot.create({
        data: {
          companyId,
          truckId: wo.truckId,
          reading: odometer,
          source: "work_order",
          recordedAt: completedAt,
        },
      });
    } else if (wo.truck.status === "in_shop") {
      await tx.truck.update({
        where: { id: wo.truckId },
        data: { status: "active" },
      });
    }

    if (opts.createRecord !== false && wo.totalAmount > 0) {
      await tx.maintenanceRecord.create({
        data: {
          companyId,
          truckId: wo.truckId,
          workOrderId: wo.id,
          date: completedAt,
          vendor: wo.vendor?.name ?? "",
          description: wo.title,
          amount: wo.totalAmount,
          category: wo.category,
          odometer: odometer ?? null,
        },
      });
    }

    const hasPm = wo.lines.some((l) => l.isPm);
    if (hasPm) {
      const mileage = odometer ?? wo.truck.mileage;
      const programs = await tx.serviceProgram.findMany({
        where: {
          companyId,
          OR: [{ truckId: wo.truckId }, { truckId: null }],
        },
      });
      for (const program of programs) {
        const { nextDueAt, nextDueMiles } = computeNextDue({
          completedAt,
          mileage,
          intervalMiles: program.intervalMiles,
          intervalDays: program.intervalDays,
        });
        await tx.serviceProgram.update({
          where: { id: program.id },
          data: {
            lastCompletedAt: completedAt,
            nextDueAt,
            nextDueMiles,
          },
        });
      }
    }

    return workOrder;
  });

  return updated;
}

export async function markProgramServiced(
  companyId: string,
  programId: string,
  opts: { completedAt?: Date; mileage?: number } = {}
) {
  const program = await prisma.serviceProgram.findFirst({
    where: { id: programId, companyId },
    include: { truck: true },
  });
  if (!program) throw new Error("Program not found");

  const completedAt = opts.completedAt ?? new Date();
  const mileage =
    opts.mileage ??
    program.truck?.mileage ??
    (await prisma.truck.findFirst({ where: { id: program.truckId ?? "" } }))?.mileage ??
    0;

  const { nextDueAt, nextDueMiles } = computeNextDue({
    completedAt,
    mileage,
    intervalMiles: program.intervalMiles,
    intervalDays: program.intervalDays,
  });

  return prisma.serviceProgram.update({
    where: { id: program.id },
    data: { lastCompletedAt: completedAt, nextDueAt, nextDueMiles },
    include: { truck: { select: { id: true, unitNumber: true, mileage: true } } },
  });
}
