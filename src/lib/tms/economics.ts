export type LoadEconomicsInput = {
  linehaulRevenue?: number | null;
  fuelSurcharge?: number | null;
  accessorialCharges?: number | null;
  loadedMiles?: number | null;
  emptyMiles?: number | null;
  driverPay?: number | null;
  fuelCost?: number | null;
  tollCost?: number | null;
  insuranceCost?: number | null;
  otherCosts?: number | null;
};

export function computeEconomics(input: LoadEconomicsInput) {
  const linehaulRevenue = Number(input.linehaulRevenue) || 0;
  const fuelSurcharge = Number(input.fuelSurcharge) || 0;
  const accessorialCharges = Number(input.accessorialCharges) || 0;
  const loadedMiles = Number(input.loadedMiles) || 0;
  const emptyMiles = Number(input.emptyMiles) || 0;
  const driverPay = Number(input.driverPay) || 0;
  const fuelCost = Number(input.fuelCost) || 0;
  const tollCost = Number(input.tollCost) || 0;
  const insuranceCost = Number(input.insuranceCost) || 0;
  const otherCosts = Number(input.otherCosts) || 0;

  const totalRevenue = linehaulRevenue + fuelSurcharge + accessorialCharges;
  const totalMiles = loadedMiles + emptyMiles;
  const totalCost = driverPay + fuelCost + tollCost + insuranceCost + otherCosts;
  const grossMargin = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : null;
  const ratePerMile = totalMiles > 0 ? totalRevenue / totalMiles : null;
  const deadheadPercentage = totalMiles > 0 ? (emptyMiles / totalMiles) * 100 : null;

  return {
    linehaulRevenue,
    fuelSurcharge,
    accessorialCharges,
    loadedMiles,
    emptyMiles,
    driverPay,
    fuelCost,
    tollCost,
    insuranceCost,
    otherCosts,
    totalRevenue,
    totalMiles,
    totalCost,
    grossMargin,
    marginPercentage,
    ratePerMile,
    deadheadPercentage,
    rate: totalRevenue,
    miles: totalMiles,
  };
}

export function originDestinationFromStops(
  stops: { type: string; city?: string; state?: string; sequence: number }[],
) {
  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);
  const pickups = ordered.filter((s) => s.type === "pickup");
  const deliveries = ordered.filter((s) => s.type === "delivery");
  const first = pickups[0] ?? ordered[0];
  const last = deliveries[deliveries.length - 1] ?? ordered[ordered.length - 1];
  const fmt = (s?: { city?: string; state?: string }) =>
    s ? [s.city, s.state].filter(Boolean).join(", ") : "";
  return {
    origin: fmt(first),
    destination: fmt(last),
  };
}
