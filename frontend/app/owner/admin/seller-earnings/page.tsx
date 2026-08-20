// app/owner/admin/seller-earnings/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  IndianRupee,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  Store,
} from "lucide-react";
import adminApi from "@/lib/adminApi";

interface SellerEarning {
  _id: string;

  seller: {
    _id: string;
    shopName: string;
    userId?: string;
  } | null;

  date: string;

  openProducts: {
    productsSold: number;
    totalSales: number;
  };

  packetProducts: {
    productsSold: number;
    totalSales: number;
  };

  total: {
    productsSold: number;
    totalSales: number;
  };

  paymentStatus: "pending" | "settled";

  settledAt?: string | null;

  settledBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;

  createdAt?: string;
  updatedAt?: string;
}

interface SellerEarningsSummary {
  totalSellers: number;

  openProductsSold: number;
  openProductsSales: number;

  packetProductsSold: number;
  packetProductsSales: number;

  totalProductsSold: number;
  totalSales: number;

  pendingSellers: number;
  settledSellers: number;
}

interface SellerEarningsResponse {
  success: boolean;
  page: number;
  limit: number;
  totalEarnings: number;
  totalPages: number;
  summary: SellerEarningsSummary;
  earnings: SellerEarning[];
}

const getTodayIndia = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const EMPTY_SUMMARY: SellerEarningsSummary = {
  totalSellers: 0,
  openProductsSold: 0,
  openProductsSales: 0,
  packetProductsSold: 0,
  packetProductsSales: 0,
  totalProductsSold: 0,
  totalSales: 0,
  pendingSellers: 0,
  settledSellers: 0,
};

export default function SellerEarningsPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayIndia());

  const [earnings, setEarnings] = useState<SellerEarning[]>([]);

  const [summary, setSummary] = useState<SellerEarningsSummary>(EMPTY_SUMMARY);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalEarnings, setTotalEarnings] = useState(0);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [settlingEarningId, setSettlingEarningId] = useState<string | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [paymentFilter, setPaymentFilter] = useState<
    "" | "pending" | "settled"
  >("");

  const [error, setError] = useState("");

  // --------------------------------------------------
  // Fetch seller earnings
  // --------------------------------------------------

  const fetchEarnings = useCallback(
    async (showRefreshLoader = false) => {
      try {
        setError("");

        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await adminApi.get<SellerEarningsResponse>(
          "/admin/seller-earnings",
          {
            params: {
              date: selectedDate,
              page,
              limit: 7,
              ...(paymentFilter
                ? {
                    paymentStatus: paymentFilter,
                  }
                : {}),
            },
          },
        );

        if (!response.data.success) {
          throw new Error("Failed to fetch seller earnings.");
        }

        setEarnings(response.data.earnings || []);

        setSummary(response.data.summary || EMPTY_SUMMARY);

        setTotalPages(response.data.totalPages || 1);

        setTotalEarnings(response.data.totalEarnings || 0);
      } catch (err: any) {
        console.error("Fetch seller earnings error:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch seller earnings.",
        );

        setEarnings([]);

        setSummary(EMPTY_SUMMARY);

        setTotalPages(1);

        setTotalEarnings(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate, page, paymentFilter],
  );

  // --------------------------------------------------
  // Fetch when date/page/filter changes
  // --------------------------------------------------

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // --------------------------------------------------
  // Reset pagination when date/filter changes
  // --------------------------------------------------

  useEffect(() => {
    setPage(1);
  }, [selectedDate, paymentFilter]);

  // --------------------------------------------------
  // Settle seller earning
  // --------------------------------------------------

  const handleSettle = async (earning: SellerEarning) => {
    if (earning.paymentStatus === "settled") {
      return;
    }

    const sellerName = earning.seller?.shopName || "this seller";

    const confirmed = window.confirm(
      `Mark ${formatCurrency(
        earning.total.totalSales,
      )} as settled for ${sellerName} for ${formatDisplayDate(selectedDate)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSettlingEarningId(earning._id);

      setError("");

      await adminApi.patch(`/admin/seller-earnings/${earning._id}/status`, {
        paymentStatus: "settled",
      });

      // Refresh selected page so values come directly
      // from the backend after settlement.
      await fetchEarnings(true);
    } catch (err: any) {
      console.error("Settle seller earning error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to settle seller earning.",
      );
    } finally {
      setSettlingEarningId(null);
    }
  };

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const filteredEarnings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return earnings;
    }

    return earnings.filter((earning) => {
      const shopName = earning.seller?.shopName?.toLowerCase() || "";

      return shopName.includes(search);
    });
  }, [earnings, searchTerm]);

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------

  function formatDisplayDate(date: string) {
    if (!date) {
      return "";
    }

    const datePart = date.includes("T") ? date.split("T")[0] : date;

    const [year, month, day] = datePart.split("-");

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  // --------------------------------------------------
  // Currency
  // --------------------------------------------------

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-lg bg-gray-200" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 rounded-2xl bg-gray-200" />
              ))}
            </div>

            <div className="h-16 rounded-2xl bg-gray-200" />

            <div className="rounded-2xl bg-white p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-xl bg-gray-100" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
        {/* --------------------------------------------------
            Header
        -------------------------------------------------- */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                <Store size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Seller Earnings
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage seller earnings and settlement payments.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchEarnings(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* --------------------------------------------------
            Date selector
        -------------------------------------------------- */}

        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="earning-date"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Earnings Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="earning-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
            </div>

            <div className="min-w-0 text-sm text-gray-500 sm:text-right">
              Showing earnings for{" "}
              <span className="font-semibold text-gray-900">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------
            Error
        -------------------------------------------------- */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="mt-0.5">
              <Clock3 size={18} />
            </div>

            <div className="flex-1">
              <p className="font-semibold">Something went wrong</p>

              <p className="mt-1">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => fetchEarnings(true)}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* --------------------------------------------------
            Summary cards
        -------------------------------------------------- */}

        <section className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<Store size={20} />}
            title="Sellers"
            value={summary.totalSellers.toLocaleString("en-IN")}
            description="Sellers with earnings"
          />

          <SummaryCard
            icon={<Package size={20} />}
            title="Open Products"
            value={summary.openProductsSold.toLocaleString("en-IN")}
            description={formatCurrency(summary.openProductsSales)}
          />

          <SummaryCard
            icon={<PackageCheck size={20} />}
            title="Packet Products"
            value={summary.packetProductsSold.toLocaleString("en-IN")}
            description={formatCurrency(summary.packetProductsSales)}
          />

          <SummaryCard
            icon={
              summary.pendingSellers > 0 ? (
                <Clock3 size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )
            }
            title="Overall Earnings"
            value={formatCurrency(summary.totalSales)}
            description={
              summary.pendingSellers > 0
                ? `${summary.pendingSellers} pending · ${summary.settledSellers} settled`
                : "All seller payments settled"
            }
          />
        </section>

        {/* --------------------------------------------------
            Seller list
        -------------------------------------------------- */}

        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-col gap-4 border-b border-gray-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Seller Earnings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredEarnings.length} seller
                {filteredEarnings.length === 1 ? "" : "s"} shown
                {totalEarnings > 0
                  ? ` · ${totalEarnings} total record${
                      totalEarnings === 1 ? "" : "s"
                    }`
                  : ""}
              </p>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row lg:w-auto">
              {/* Search */}

              <div className="relative w-full min-w-0 lg:w-64">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search seller..."
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {/* Payment filter */}

              <select
                value={paymentFilter}
                onChange={(event) => {
                  setPaymentFilter(
                    event.target.value as "" | "pending" | "settled",
                  );
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 sm:w-40"
              >
                <option value="">All Payments</option>
                <option value="pending">Pending</option>
                <option value="settled">Settled</option>
              </select>
            </div>
          </div>

          {/* --------------------------------------------------
              Desktop/tablet table
          -------------------------------------------------- */}

          <div className="w-full min-w-0 overflow-x-auto md:block">
            <table className="w-full min-w-245 table-fixed">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Seller
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Open Products
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Packet Products
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Overall
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEarnings.map((earning) => (
                  <tr
                    key={earning._id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                  >
                    {/* Seller */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <SellerAvatar
                          name={earning.seller?.shopName || "Seller"}
                        />

                        <div>
                          <p className="font-semibold text-gray-900">
                            {earning.seller?.shopName || "Unknown Seller"}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            {formatDisplayDate(
                              earning.date
                                ? earning.date.split("T")[0]
                                : selectedDate,
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Open products */}

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <Package size={16} className="text-gray-400" />
                          {earning.openProducts.productsSold}
                        </div>

                        <p className="text-xs font-semibold text-gray-500">
                          {formatCurrency(earning.openProducts.totalSales)}
                        </p>
                      </div>
                    </td>

                    {/* Packet products */}

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <PackageCheck size={16} className="text-gray-400" />

                          {earning.packetProducts.productsSold}
                        </div>

                        <p className="text-xs font-semibold text-gray-500">
                          {formatCurrency(earning.packetProducts.totalSales)}
                        </p>
                      </div>
                    </td>

                    {/* Overall */}

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(earning.total.totalSales)}
                        </p>

                        <p className="text-xs text-gray-500">
                          {earning.total.productsSold} products
                        </p>
                      </div>
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      <PaymentStatus status={earning.paymentStatus} />
                    </td>

                    {/* Action */}

                    <td className="px-5 py-4 text-right">
                      <PaymentButton
                        earning={earning}
                        loading={settlingEarningId === earning._id}
                        onClick={() => handleSettle(earning)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --------------------------------------------------
              Mobile cards
          -------------------------------------------------- */}

          <div className="divide-y divide-gray-100 md:hidden">
            {filteredEarnings.map((earning) => (
              <div key={earning._id} className="space-y-4 p-4">
                {/* Seller header */}

                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <SellerAvatar name={earning.seller?.shopName || "Seller"} />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {earning.seller?.shopName || "Unknown Seller"}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatDisplayDate(
                          earning.date
                            ? earning.date.split("T")[0]
                            : selectedDate,
                        )}
                      </p>
                    </div>
                  </div>

                  <PaymentStatus status={earning.paymentStatus} />
                </div>

                {/* Open */}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">
                      Open Products
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-gray-900">
                      <Package size={17} />

                      {earning.openProducts.productsSold}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {formatCurrency(earning.openProducts.totalSales)}
                    </p>
                  </div>

                  {/* Packet */}

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">
                      Packet Products
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-gray-900">
                      <PackageCheck size={17} />

                      {earning.packetProducts.productsSold}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {formatCurrency(earning.packetProducts.totalSales)}
                    </p>
                  </div>
                </div>

                {/* Overall */}

                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Overall Total
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(earning.total.totalSales)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">Products Sold</p>

                      <p className="mt-1 text-sm font-bold text-gray-900">
                        {earning.total.productsSold}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment action */}

                <PaymentButton
                  earning={earning}
                  loading={settlingEarningId === earning._id}
                  onClick={() => handleSettle(earning)}
                  fullWidth
                />
              </div>
            ))}
          </div>

          {/* --------------------------------------------------
              Empty state
          -------------------------------------------------- */}

          {filteredEarnings.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Store size={25} />
              </div>

              <h3 className="mt-4 text-base font-bold text-gray-900">
                No seller earnings found
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                {searchTerm
                  ? "No seller matches your search."
                  : paymentFilter
                    ? `There are no ${paymentFilter} seller earnings for ${formatDisplayDate(
                        selectedDate,
                      )}.`
                    : `There are no seller earnings recorded for ${formatDisplayDate(
                        selectedDate,
                      )}.`}
              </p>
            </div>
          )}

          {/* --------------------------------------------------
              Pagination
          -------------------------------------------------- */}

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-900">{page}</span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || refreshing}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages || refreshing}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ==================================================
// Summary Card
// ==================================================

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500">{title}</p>

      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>

      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}

// ==================================================
// Seller Avatar
// ==================================================

function SellerAvatar({ name }: { name: string }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
      {initial}
    </div>
  );
}

// ==================================================
// Payment Status
// ==================================================

function PaymentStatus({ status }: { status: "pending" | "settled" }) {
  if (status === "settled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 size={14} />
        Settled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock3 size={14} />
      Pending
    </span>
  );
}

// ==================================================
// Payment Button
// ==================================================

function PaymentButton({
  earning,
  loading,
  onClick,
  fullWidth = false,
}: {
  earning: SellerEarning;
  loading: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  if (earning.paymentStatus === "settled") {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 ${
          fullWidth ? "w-full" : ""
        }`}
      >
        <CheckCircle2 size={16} />
        Settled
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {loading ? (
        <>
          <RefreshCw size={16} className="animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CircleDollarSign size={16} />
          Settle
        </>
      )}
    </button>
  );
}
