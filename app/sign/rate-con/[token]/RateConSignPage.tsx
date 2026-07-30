"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, FileText, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/src/lib/format";

interface RateConData {
  loadNumber: string;
  customerName: string;
  carrierName: string;
  rate: number | null;
  miles: number | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  origin: string | null;
  destination: string | null;
  equipment: string | null;
  notes: string | null;
  signed: boolean;
  signedBy: string | null;
  signedAt: string | null;
}

export function RateConSignPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [data, setData] = useState<RateConData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const fetchRateCon = useCallback(async () => {
    try {
      const res = await fetch(`/api/tms/rate-cons/${token}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Rate confirmation not found.");
      }
      const json = await res.json();
      setData(json.rateCon ?? json);
      if (json.rateCon?.signed || json.signed) setSigned(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRateCon();
  }, [fetchRateCon]);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!signerName.trim()) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/tms/rate-cons/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: signerName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Signing failed.");
      }
      setSigned(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-900 dark:to-gray-950">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900 dark:bg-gray-900">
          <FileText className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Not found</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 dark:from-gray-900 dark:to-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="mx-auto w-full max-w-2xl"
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Rate confirmation
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and sign the rate confirmation for load {data.loadNumber}
          </p>
        </div>

        {/* Load summary card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {data.loadNumber}
                </p>
                <p className="text-sm text-gray-500">{data.customerName}</p>
              </div>
              {data.rate != null && (
                <p className="text-xl font-bold text-blue-600">{formatCurrency(data.rate)}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Carrier</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {data.carrierName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Equipment</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {data.equipment || "—"}
                </p>
              </div>
            </div>

            {(data.origin || data.destination) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Origin</p>
                  <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                    {data.origin || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Destination</p>
                  <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                    {data.destination || "—"}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Pickup</p>
                <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(data.pickupDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Delivery</p>
                <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(data.deliveryDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Miles</p>
                <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                  {data.miles != null ? data.miles.toLocaleString() : "—"}
                </p>
              </div>
            </div>

            {data.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Notes</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{data.notes}</p>
              </div>
            )}
          </div>

          {/* Sign section */}
          <div className="border-t border-gray-100 px-6 py-5 dark:border-gray-800">
            {signed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-4 text-center"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Rate confirmation signed
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {data.signedBy
                    ? `Signed by ${data.signedBy} on ${formatDate(data.signedAt)}`
                    : "Thank you! This rate confirmation has been accepted."}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSign}>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  By entering your name and clicking &quot;Accept & Sign&quot;, you agree to the
                  terms of this rate confirmation.
                </p>
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Your full name
                  </label>
                  <input
                    required
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                {error && (
                  <p className="mb-3 text-sm text-red-600">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={signing || !signerName.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Accept & Sign
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by Adapt TMS
        </p>
      </motion.div>
    </div>
  );
}
