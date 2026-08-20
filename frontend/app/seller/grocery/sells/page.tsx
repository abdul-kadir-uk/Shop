// app/seller/grocery/sells/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import api from "@/lib/api";

interface SellerEarningCategory {
  productsSold: number;
  totalSales: number;
}

interface SellerEarning {
  _id: string | null;
  date: string;

  openProducts: SellerEarningCategory;

  packetProducts: SellerEarningCategory;

  total: SellerEarningCategory;

  paymentStatus: "pending" | "settled";

  settledAt: string | null;

  createdAt: string | null;

  updatedAt: string | null;
}

interface SellerEarningsResponse {
  success: boolean;

  page: number;

  limit: number;

  totalDays: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;

  startDate: string | null;

  endDate: string | null;

  days: SellerEarning[];
}

export default function SellerSellsPage() {
  const [earnings, setEarnings] = useState<SellerEarning[]>([]);

  const [page, setPage] = useState(1);

  const [hasNextPage, setHasNextPage] = useState(false);

  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [startDate, setStartDate] = useState<string | null>(null);

  const [endDate, setEndDate] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ------------------------------------------------------
  // Format currency
  // ------------------------------------------------------

  const formatCurrency = (value: number) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  // ------------------------------------------------------
  // Format date
  // ------------------------------------------------------

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  // ------------------------------------------------------
  // Fetch earnings
  // ------------------------------------------------------

  const fetchEarnings = useCallback(async (pageNumber: number) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<SellerEarningsResponse>(
        `/seller/earnings?page=${pageNumber}`,
      );

      if (!response.data.success) {
        setError("Failed to load seller earnings.");
        return;
      }

      setEarnings(response.data.days);

      setPage(response.data.page);

      setHasNextPage(response.data.hasNextPage);

      setHasPreviousPage(response.data.hasPreviousPage);

      setStartDate(response.data.startDate);

      setEndDate(response.data.endDate);
    } catch (error) {
      console.error("Seller Earnings Error:", error);

      setError("Failed to load seller earnings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ------------------------------------------------------
  // Initial load
  // ------------------------------------------------------

  useEffect(() => {
    fetchEarnings(1);
  }, [fetchEarnings]);

  // ------------------------------------------------------
  // Previous page
  //
  // Previous means newer seven days.
  // ------------------------------------------------------

  const handlePrevious = () => {
    if (!hasPreviousPage || loading) {
      return;
    }

    fetchEarnings(page - 1);
  };

  // ------------------------------------------------------
  // Next page
  //
  // Next means older seven days.
  // ------------------------------------------------------

  const handleNext = () => {
    if (!hasNextPage || loading) {
      return;
    }

    fetchEarnings(page + 1);
  };

  // ------------------------------------------------------
  // Loading state
  // ------------------------------------------------------

  if (loading && earnings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sells</h1>

          <p className="text-gray-500 mt-1">
            View your daily grocery sales and earnings.
          </p>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white rounded-xl shadow p-5 sm:p-6 animate-pulse"
            >
              <div className="h-6 w-40 bg-gray-200 rounded" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {[1, 2, 3].map((box) => (
                  <div key={box} className="h-24 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // Error state
  // ------------------------------------------------------

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sells</h1>

          <p className="text-gray-500 mt-1">
            View your daily grocery sales and earnings.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow border p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>

          <button
            type="button"
            onClick={() => fetchEarnings(page)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // Empty state
  // ------------------------------------------------------

  if (earnings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sells</h1>

          <p className="text-gray-500 mt-1">
            View your daily grocery sales and earnings.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow border p-10 text-center">
          <h2 className="text-xl font-semibold text-gray-900">No sales yet</h2>

          <p className="text-gray-500 mt-2">
            Your delivered sales will appear here.
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // Page
  // ------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------- */}
      {/* Header */}
      {/* -------------------------------------------------- */}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sells</h1>

        <p className="text-gray-500 mt-1">
          View your daily grocery sales and earnings.
        </p>
      </div>

      {/* -------------------------------------------------- */}
      {/* Date Range */}
      {/* -------------------------------------------------- */}

      {startDate && endDate && (
        <div className="bg-white rounded-xl shadow border p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Sales Period</p>

              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {formatDate(endDate)}{" "}
                <span className="text-gray-400 font-normal">to</span>{" "}
                {formatDate(startDate)}
              </h2>
            </div>

            <div className="text-sm text-gray-500">Page {page}</div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* Daily Earnings */}
      {/* -------------------------------------------------- */}

      <div className="space-y-5">
        {earnings.map((earning) => (
          <div
            key={earning._id || earning.date}
            className="bg-white rounded-xl shadow border overflow-hidden"
          >
            {/* -------------------------------------------- */}
            {/* Date */}
            {/* -------------------------------------------- */}

            <div className="px-5 py-4 sm:px-6 border-b bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {formatDate(earning.date)}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">Daily sales</p>
                </div>

                {/* Payment Status */}

                <div>
                  {earning.paymentStatus === "settled" ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Settled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* -------------------------------------------- */}
            {/* Sales */}
            {/* -------------------------------------------- */}

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Open Products */}

                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">
                    Open Products
                  </p>

                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Products Sold</p>

                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {earning.openProducts.productsSold}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Total Price</p>

                    <p className="text-xl font-semibold text-gray-900 mt-1">
                      {formatCurrency(earning.openProducts.totalSales)}
                    </p>
                  </div>
                </div>

                {/* Packet Products */}

                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">
                    Packet Products
                  </p>

                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Products Sold</p>

                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {earning.packetProducts.productsSold}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Total Price</p>

                    <p className="text-xl font-semibold text-gray-900 mt-1">
                      {formatCurrency(earning.packetProducts.totalSales)}
                    </p>
                  </div>
                </div>

                {/* Total */}

                <div className="rounded-xl border bg-gray-900 p-4">
                  <p className="text-sm font-medium text-gray-300">Total</p>

                  <div className="mt-3">
                    <p className="text-sm text-gray-400">Products Sold</p>

                    <p className="text-2xl font-bold text-white mt-1">
                      {earning.total.productsSold}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-400">Total Price</p>

                    <p className="text-xl font-semibold text-white mt-1">
                      {formatCurrency(earning.total.totalSales)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------ */}
              {/* Settlement Information */}
              {/* ------------------------------------------ */}

              {earning.paymentStatus === "settled" && earning.settledAt && (
                <div className="mt-5 pt-4 border-t">
                  <p className="text-sm text-gray-500">Payment settled on</p>

                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {formatDate(earning.settledAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------- */}
      {/* Pagination */}
      {/* -------------------------------------------------- */}

      <div className="bg-white rounded-xl shadow border p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Previous */}

          <button
            type="button"
            onClick={handlePrevious}
            disabled={!hasPreviousPage || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />

            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page */}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            {loading && <span className="animate-pulse">Loading...</span>}

            {!loading && <span>Page {page}</span>}
          </div>

          {/* Next */}

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNextPage || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Next</span>

            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
