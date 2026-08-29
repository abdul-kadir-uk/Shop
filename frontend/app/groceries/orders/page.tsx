// app/groceries/orders/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, PackageOpen, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { isLoggedIn } from "@/lib/auth";
import { getMyOrders } from "@/lib/groceryOrderApi";

import OrderCard from "@/components/groceries/orders/OrderCard";

// ======================================================
// Order Product Type
// Matches backend `products[]` response
// ======================================================

type OrderProduct = {
  productId: string;
  name: string;
  image: string;
  brand: string;
  quantity: number;

  variant?: {
    quantity: number;
    unit: string;
    label: string;
  };

  price: number;
  discountPrice: number | null;
  subtotal: number;
  orderStatus: string;
};

// ======================================================
// Order Type
// Matches backend /api/orders/my-orders response
// ======================================================

type Order = {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  createdAt: string;

  products: OrderProduct[];
  itemCount: number;

  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  };

  paymentMethod: string;
  paymentStatus: string;
};

export default function MyOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================================
  // Fetch Orders
  // ======================================================

  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getMyOrders();

      if (!response.success) {
        setError(response.message || "Failed to load orders.");
        return;
      }

      setOrders(response.orders || []);
    } catch (err: any) {
      console.error("Get My Orders Error:", err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        router.replace("/login");
        return;
      }

      setError(err?.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ======================================================
  // Initial Load
  // ======================================================

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ======================================================
  // Loading
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={32} className="animate-spin text-green-600" />

          <p className="text-sm">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // ======================================================
  // Page
  // ======================================================

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-green-600"
      >
        <ArrowLeft size={17} />
        Back
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            My Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and track your grocery orders.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:border-green-500 hover:text-green-600 sm:self-auto"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={fetchOrders}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!error && orders.length === 0 && (
        <div className="rounded-xl border bg-white px-5 py-12 text-center shadow-sm">
          <PackageOpen size={52} className="mx-auto text-gray-300" />

          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            No orders yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            You haven't placed any grocery orders yet. Start shopping and your
            orders will appear here.
          </p>

          <Link
            href="/groceries"
            className="mt-5 inline-flex rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {/* Orders */}
      {!error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
