// components/grocery/delivery/DeliveryDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Package, CheckCircle2, Truck, RefreshCw } from "lucide-react";

import {
  getDeliveryDashboard,
  type DeliveryDashboardStats,
} from "@/lib/deliveryApi";

import { useAuth } from "@/context/authContext";

export default function DeliveryDashboard() {
  const router = useRouter();

  const { loading: authLoading, isLoggedIn } = useAuth();

  const [stats, setStats] = useState<DeliveryDashboardStats>({
    availableDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    totalAssigned: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ======================================================
  // Fetch Dashboard
  // ======================================================

  const fetchDashboard = async (showFullLoader = true) => {
    // Never fetch dashboard when user is logged out
    if (!isLoggedIn) {
      return;
    }

    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      // ----------------------------------------------
      // ONE API REQUEST
      // ----------------------------------------------

      const data = await getDeliveryDashboard();

      if (!data.success) {
        throw new Error("Failed to load dashboard.");
      }

      // ----------------------------------------------
      // Dashboard statistics
      // ----------------------------------------------

      setStats(data.dashboard);
    } catch (error) {
      console.error("Delivery Dashboard Error:", error);

      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ======================================================
  // Authentication / Initial Load
  // ======================================================

  useEffect(() => {
    // Wait until authentication check is finished
    if (authLoading) {
      return;
    }

    // User is not logged in
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // User is authenticated, now fetch dashboard
    fetchDashboard();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn]);

  // ======================================================
  // Authentication Loading
  // ======================================================

  if (authLoading) {
    return (
      <div className="flex min-h-75 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      </div>
    );
  }

  // ======================================================
  // Logged Out
  // ======================================================

  if (!isLoggedIn) {
    return null;
  }

  // ======================================================
  // Loading
  // ======================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your delivery activity.
          </p>
        </div>

        <DashboardSkeleton />
      </div>
    );
  }

  // ======================================================
  // Error
  // ======================================================

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your delivery activity.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                router.replace("/login");
                return;
              }

              fetchDashboard();
            }}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // Dashboard
  // ======================================================

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your delivery activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              router.replace("/login");
              return;
            }

            fetchDashboard(false);
          }}
          disabled={refreshing}
          className="flex w-fit items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available"
          value={stats.availableDeliveries}
          description="Deliveries waiting for acceptance"
          icon={Package}
        />

        <StatCard
          title="Pending"
          value={stats.pendingDeliveries}
          description="Your active deliveries"
          icon={Truck}
        />

        <StatCard
          title="Completed"
          value={stats.completedDeliveries}
          description="Delivered or cancelled"
          icon={CheckCircle2}
        />
      </div>
    </div>
  );
}

// ======================================================
// Statistic Card
// ======================================================

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">{description}</p>
    </div>
  );
}

// ======================================================
// Skeleton
// ======================================================

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-24 rounded bg-gray-200" />

            <div className="mt-3 h-9 w-16 rounded bg-gray-200" />

            <div className="mt-4 h-3 w-40 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="animate-pulse rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-5">
          <div className="h-5 w-40 rounded bg-gray-200" />

          <div className="mt-2 h-3 w-56 rounded bg-gray-200" />
        </div>

        <div className="space-y-4 p-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 rounded bg-gray-100" />
          ))}
        </div>
      </div>
    </>
  );
}
