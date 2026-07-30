"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Truck, MapPin, Calendar, CheckCircle2, Clock, Package } from "lucide-react";

interface StopData {
  type: string;
  city: string;
  state: string;
  scheduledAt: string | null;
  arrivedAt: string | null;
  departedAt: string | null;
}

interface TrackingData {
  loadNumber: string;
  status: string;
  origin: string;
  destination: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  driverFirstName: string | null;
  stops: StopData[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-800" },
  in_transit: { label: "In Transit", color: "bg-emerald-100 text-emerald-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

function formatDate(iso: string | null) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LoadTrackingPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tms/track/${token}`)
      .then((r) => (r.ok ? r.json() : r.json().then((b) => Promise.reject(b.error))))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(typeof err === "string" ? err : "Tracking link is invalid or expired.");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900">Tracking Unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">
            {error ?? "Unable to find this shipment."}
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[data.status] ?? {
    label: data.status,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-base font-semibold leading-tight text-gray-900">
              Shipment Tracking
            </p>
            <p className="text-xs text-gray-400">Powered by Adapt</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Load
              </p>
              <p className="text-xl font-bold text-gray-900">{data.loadNumber}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-green-500" />
              <div>
                <p className="text-xs text-gray-400">Origin</p>
                <p className="text-sm font-medium text-gray-900">
                  {data.origin || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="text-xs text-gray-400">Destination</p>
                <p className="text-sm font-medium text-gray-900">
                  {data.destination || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Pickup</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(data.pickupDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Delivery</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(data.deliveryDate)}
                </p>
              </div>
            </div>
          </div>

          {data.driverFirstName && (
            <div className="mb-5 rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400">Driver</p>
              <p className="text-sm font-medium text-gray-900">{data.driverFirstName}</p>
            </div>
          )}

          {data.stops.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Stops</h2>
              <div className="space-y-3">
                {data.stops.map((stop, i) => {
                  const completed = Boolean(stop.departedAt);
                  const atLocation = Boolean(stop.arrivedAt && !stop.departedAt);

                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {completed ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : atLocation ? (
                          <Truck size={18} className="text-blue-500" />
                        ) : (
                          <Clock size={18} className="text-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          <span className="capitalize">{stop.type}</span>
                          {stop.city || stop.state
                            ? ` — ${[stop.city, stop.state].filter(Boolean).join(", ")}`
                            : ""}
                        </p>
                        {stop.scheduledAt && (
                          <p className="text-xs text-gray-400">
                            Scheduled: {formatDate(stop.scheduledAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
