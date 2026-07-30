type InvoiceLike = {
  total: number;
  balance: number;
  billToName?: string | null;
  customer?: { name?: string | null } | null;
  load?: { loadNumber?: string | null; customerName?: string | null } | null;
  lineItems?: Array<{ rate: number; [key: string]: unknown }>;
  payments?: Array<{ paymentDate: Date | string; [key: string]: unknown }>;
  [key: string]: unknown;
};

/** Flatten invoice fields to the shape TMS UI pages expect. */
export function shapeInvoice<T extends InvoiceLike>(inv: T) {
  return {
    ...inv,
    totalAmount: inv.total,
    balanceDue: inv.balance,
    customerName:
      inv.customer?.name ?? inv.billToName ?? inv.load?.customerName ?? "",
    loadNumber: inv.load?.loadNumber ?? "",
    lineItems: (inv.lineItems ?? []).map((li) => ({
      ...li,
      unitPrice: li.rate,
    })),
    payments: (inv.payments ?? []).map((p) => ({
      ...p,
      paidAt: p.paymentDate,
    })),
  };
}
