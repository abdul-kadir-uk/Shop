// app/owner/admin/delivery-earnings/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  IndianRupee,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import adminApi from "@/lib/adminApi";

interface DeliveryPartnerEarning {
  deliveryPartnerId: string;
  name: string;
  mobile?: string;
  totalOrders: number;
  totalEarnings: number;
  paymentStatus: "pending" | "paid";
}

interface EarningsSummary {
  totalDeliveryPartners: number;
  totalOrders: number;
  totalEarnings: number;
  pendingPartners: number;
  paidPartners: number;
}

interface DailyEarningsResponse {
  success: boolean;
  date: string;
  data: DeliveryPartnerEarning[];
  summary: EarningsSummary;
}

const getTodayIndia = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

export default function DeliveryEarningsPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayIndia());

  const [partners, setPartners] = useState<DeliveryPartnerEarning[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalDeliveryPartners: 0,
    totalOrders: 0,
    totalEarnings: 0,
    pendingPartners: 0,
    paidPartners: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingPartnerId, setPayingPartnerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Fetch daily earnings
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

        const response = await adminApi.get<DailyEarningsResponse>(
          "/admin/delivery/earnings/daily",
          {
            params: {
              date: selectedDate,
            },
          },
        );

        if (!response.data.success) {
          throw new Error("Failed to fetch delivery earnings.");
        }

        setPartners(response.data.data || []);

        setSummary(
          response.data.summary || {
            totalDeliveryPartners: 0,
            totalOrders: 0,
            totalEarnings: 0,
            pendingPartners: 0,
            paidPartners: 0,
          },
        );
      } catch (err: any) {
        console.error("Fetch delivery earnings error:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch delivery earnings.",
        );

        setPartners([]);
        setSummary({
          totalDeliveryPartners: 0,
          totalOrders: 0,
          totalEarnings: 0,
          pendingPartners: 0,
          paidPartners: 0,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate],
  );

  // --------------------------------------------------
  // Fetch when date changes
  // --------------------------------------------------

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // --------------------------------------------------
  // Mark partner day's earnings as paid
  // --------------------------------------------------

  const handleMarkAsPaid = async (deliveryPartner: DeliveryPartnerEarning) => {
    if (deliveryPartner.paymentStatus === "paid") {
      return;
    }

    const confirmed = window.confirm(
      `Mark ₹${deliveryPartner.totalEarnings.toLocaleString(
        "en-IN",
      )} as paid to ${deliveryPartner.name} for ${formatDisplayDate(
        selectedDate,
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setPayingPartnerId(deliveryPartner.deliveryPartnerId);
      setError("");

      await adminApi.patch(
        `/admin/delivery/earnings/${deliveryPartner.deliveryPartnerId}/day-paid`,
        {
          date: selectedDate,
        },
      );

      // Refresh the selected day so all values come directly
      // from the backend after payment.
      await fetchEarnings(true);
    } catch (err: any) {
      console.error("Mark delivery earnings as paid error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to mark delivery earnings as paid.",
      );
    } finally {
      setPayingPartnerId(null);
    }
  };

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const filteredPartners = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return partners;
    }

    return partners.filter((partner) => {
      return (
        partner.name.toLowerCase().includes(search) ||
        partner.mobile?.toLowerCase().includes(search)
      );
    });
  }, [partners, searchTerm]);

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------

  function formatDisplayDate(date: string) {
    if (!date) {
      return "";
    }

    const [year, month, day] = date.split("-");

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
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
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
                  <div key={index} className="h-16 rounded-xl bg-gray-100" />
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
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* --------------------------------------------------
            Header
        -------------------------------------------------- */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                <Truck size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Delivery Earnings
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage daily earnings and delivery partner payments.
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

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
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

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<Truck size={20} />}
            title="Delivery Partners"
            value={summary.totalDeliveryPartners.toLocaleString("en-IN")}
            description="Partners with earnings"
          />

          <SummaryCard
            icon={<PackageCheck size={20} />}
            title="Delivered Orders"
            value={summary.totalOrders.toLocaleString("en-IN")}
            description="Orders completed"
          />

          <SummaryCard
            icon={<IndianRupee size={20} />}
            title="Total Earnings"
            value={formatCurrency(summary.totalEarnings)}
            description="Total partner earnings"
          />

          <SummaryCard
            icon={
              summary.pendingPartners > 0 ? (
                <Clock3 size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )
            }
            title="Payment Status"
            value={
              summary.pendingPartners > 0
                ? `${summary.pendingPartners} Pending`
                : "All Paid"
            }
            description={`${summary.paidPartners} partner${
              summary.paidPartners === 1 ? "" : "s"
            } paid`}
          />
        </section>

        {/* --------------------------------------------------
            Partner list
        -------------------------------------------------- */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Delivery Partner Earnings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredPartners.length} partner
                {filteredPartners.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search partner..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>
          </div>

          {/* Desktop/tablet table */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-190">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Delivery Partner
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Delivered Orders
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Total Earning
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
                {filteredPartners.map((partner) => (
                  <tr
                    key={partner.deliveryPartnerId}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <PartnerAvatar name={partner.name} />

                        <div>
                          <p className="font-semibold text-gray-900">
                            {partner.name}
                          </p>

                          {partner.mobile && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {partner.mobile}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <PackageCheck size={17} className="text-gray-400" />
                        {partner.totalOrders}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(partner.totalEarnings)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <PaymentStatus status={partner.paymentStatus} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <PaymentButton
                        partner={partner}
                        loading={payingPartnerId === partner.deliveryPartnerId}
                        onClick={() => handleMarkAsPaid(partner)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}

          <div className="divide-y divide-gray-100 md:hidden">
            {filteredPartners.map((partner) => (
              <div key={partner.deliveryPartnerId} className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <PartnerAvatar name={partner.name} />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {partner.name}
                      </p>

                      {partner.mobile && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {partner.mobile}
                        </p>
                      )}
                    </div>
                  </div>

                  <PaymentStatus status={partner.paymentStatus} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">
                      Delivered Orders
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-gray-900">
                      <PackageCheck size={17} />
                      {partner.totalOrders}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">
                      Total Earning
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {formatCurrency(partner.totalEarnings)}
                    </p>
                  </div>
                </div>

                <PaymentButton
                  partner={partner}
                  loading={payingPartnerId === partner.deliveryPartnerId}
                  onClick={() => handleMarkAsPaid(partner)}
                  fullWidth
                />
              </div>
            ))}
          </div>

          {/* Empty state */}

          {filteredPartners.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Truck size={25} />
              </div>

              <h3 className="mt-4 text-base font-bold text-gray-900">
                No delivery earnings found
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                {searchTerm
                  ? "No delivery partner matches your search."
                  : `There are no delivery earnings recorded for ${formatDisplayDate(
                      selectedDate,
                    )}.`}
              </p>
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
// Partner Avatar
// ==================================================

function PartnerAvatar({ name }: { name: string }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "D";

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
      {initial}
    </div>
  );
}

// ==================================================
// Payment Status
// ==================================================

function PaymentStatus({ status }: { status: "pending" | "paid" }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 size={14} />
        Paid
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
  partner,
  loading,
  onClick,
  fullWidth = false,
}: {
  partner: DeliveryPartnerEarning;
  loading: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  if (partner.paymentStatus === "paid") {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 ${
          fullWidth ? "w-full" : ""
        }`}
      >
        <CheckCircle2 size={16} />
        Paid
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
          Mark as Paid
        </>
      )}
    </button>
  );
}
