"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  IndianRupee,
  Loader2,
  PackageCheck,
} from "lucide-react";

import {
  getMyDailyDeliveryEarnings,
  type DailyDeliveryEarning,
} from "@/lib/deliveryApi";

export default function DeliveryEarningsPage() {
  const [earnings, setEarnings] = useState<DailyDeliveryEarning[]>([]);

  const [page, setPage] = useState(1);

  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Fetch daily earnings
  // --------------------------------------------------

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyDailyDeliveryEarnings(page);

      if (!response.success) {
        setEarnings([]);
        setError("Failed to load earnings.");
        return;
      }

      setEarnings(response.data);

      setHasNextPage(response.pagination.hasNextPage);

      setHasPreviousPage(response.pagination.hasPreviousPage);
    } catch (error) {
      console.error("Failed to fetch delivery earnings:", error);

      setEarnings([]);

      setError("Unable to load your earnings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  // --------------------------------------------------
  // Fetch whenever page changes
  // --------------------------------------------------

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------

  const formatDate = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // Format currency
  // --------------------------------------------------

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --------------------------------------------------
  // Previous = older 5 days
  // --------------------------------------------------

  const handlePrevious = () => {
    if (!hasPreviousPage || loading) {
      return;
    }

    setPage((currentPage) => currentPage + 1);
  };

  // --------------------------------------------------
  // Next = newer 5 days
  // --------------------------------------------------

  const handleNext = () => {
    if (!hasNextPage || loading) {
      return;
    }

    setPage((currentPage) => currentPage - 1);
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />

            <span className="text-sm font-medium">Loading earnings...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* ==================================================
            Header
        ================================================== */}

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
              <IndianRupee className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

              <p className="mt-1 text-sm text-gray-500">
                Your daily delivery earnings
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            Error
        ================================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            Empty State
        ================================================== */}

        {!error && earnings.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <PackageCheck className="h-7 w-7 text-gray-500" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No earnings yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your completed delivery earnings will appear here.
            </p>
          </div>
        )}

        {/* ==================================================
            Earnings List
        ================================================== */}

        {earnings.length > 0 && (
          <div className="space-y-4">
            {earnings.map((earning) => (
              <div
                key={earning.date}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* ------------------------------------------
                    Date
                ------------------------------------------ */}

                <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <CalendarDays className="h-5 w-5 text-gray-700" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Delivery Date
                    </p>

                    <h2 className="text-base font-semibold text-gray-900">
                      {formatDate(earning.date)}
                    </h2>
                  </div>
                </div>

                {/* ------------------------------------------
                    Earnings Details
                ------------------------------------------ */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Orders */}

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-5 w-5 text-gray-600" />

                      <span className="text-sm font-medium text-gray-500">
                        Orders Delivered
                      </span>
                    </div>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {earning.totalOrders}
                    </p>
                  </div>

                  {/* Earnings */}

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-5 w-5 text-gray-600" />

                      <span className="text-sm font-medium text-gray-500">
                        Total Earnings
                      </span>
                    </div>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {formatCurrency(earning.totalEarnings)}
                    </p>
                  </div>

                  {/* Payment Status */}

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">
                      Payment Status
                    </p>

                    <div className="mt-2">
                      {earning.paymentStatus === "paid" ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================
            Pagination
        ================================================== */}

        {earnings.length > 0 && (
          <div className="mt-6 flex items-center justify-between gap-4">
            {/* Older / Previous */}

            <button
              type="button"
              onClick={handlePrevious}
              disabled={!hasPreviousPage || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />

              <span className="hidden sm:inline">Previous</span>

              <span className="sm:hidden">Previous</span>
            </button>

            {/* Page */}

            <span className="text-sm font-medium text-gray-500">
              Page {page}
            </span>

            {/* Newer / Next */}

            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNextPage || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>

              <span className="sm:hidden">Next</span>

              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
