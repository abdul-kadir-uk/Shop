"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { isLoggedIn } from "@/lib/auth";
import { cancelOrder, getSingleOrder } from "@/lib/groceryOrderApi";

import OrderStatus from "@/components/groceries/orders/OrderStatus";
import OrderProduct from "@/components/groceries/orders/OrderProduct";
import OrderDetails from "@/components/groceries/orders/OrderDetails";

// ======================================================
// Backend Product Type
// ======================================================

type OrderProductType = {
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
// Type expected by OrderProduct.tsx
// ======================================================
//
// OrderProduct component still expects the old names:
// product + productName.
//
// We will convert products -> items before passing them.
// ======================================================

type OrderItem = {
  product: string;
  productName: string;
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
// ======================================================

type Order = {
  _id: string;
  orderNumber: string;
  createdAt: string;

  products: OrderProductType[];

  shippingAddress: {
    address: string;
    city: {
      _id: string;
      name: string;
      state: string;
    };
  };

  deliveryContact: {
    primaryMobile: string;
    alternateMobile?: string;
  };

  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  };

  paymentMethod: string;
  paymentStatus: string;

  orderStatus: string;
};

export default function OrderDetailsPage() {
  const router = useRouter();

  const params = useParams<{
    orderId: string;
  }>();

  const orderId = params.orderId;

  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // ======================================================
  // Fetch Order
  // ======================================================

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isLoggedIn()) {
        router.replace("/login");
        return;
      }

      if (!orderId) return;

      try {
        setLoading(true);
        setError("");

        const response = await getSingleOrder(orderId);

        if (!response.success) {
          setError(response.message || "Failed to load order.");
          return;
        }

        setOrder(response.order);
      } catch (err: any) {
        console.error("Get Order Error:", err);

        if (err?.response?.status === 401 || err?.response?.status === 403) {
          router.replace("/login");
          return;
        }

        setError(err?.response?.data?.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  // ======================================================
  // Convert Backend Products
  // To OrderProduct Component Items
  // ======================================================

  const orderItems: OrderItem[] =
    order?.products?.map((product) => ({
      product: product.productId,
      productName: product.name,
      image: product.image,
      brand: product.brand,
      quantity: product.quantity,
      variant: product.variant,
      price: product.price,
      discountPrice: product.discountPrice,
      subtotal: product.subtotal,
      orderStatus: product.orderStatus,
    })) || [];

  // ======================================================
  // Cancel Whole Order
  // ======================================================

  const handleCancelOrder = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this entire order?",
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setCancelError("");

      const response = await cancelOrder(order._id);

      if (!response.success) {
        setCancelError(response.message || "Failed to cancel order.");
        return;
      }

      // --------------------------------------------------
      // Refresh Order Details
      // --------------------------------------------------

      const updated = await getSingleOrder(order._id);

      if (updated.success) {
        setOrder(updated.order);
      }
    } catch (err: any) {
      console.error("Cancel Order Error:", err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        router.replace("/login");
        return;
      }

      setCancelError(err?.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  // ======================================================
  // Loading
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Loading order...
        </div>
      </div>
    );
  }

  // ======================================================
  // Error
  // ======================================================

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Order Not Found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error || "We couldn't find this order."}
          </p>

          <Link
            href="/groceries"
            className="mt-5 inline-flex rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ======================================================
  // Date
  // ======================================================

  const formattedDate = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // ======================================================
  // Customer Cancellation
  // ======================================================
  //
  // Customer can cancel while order is still ordered
  // or confirmed.
  // ======================================================

  const canCancel =
    order.orderStatus === "ordered" || order.orderStatus === "confirmed";

  // ======================================================
  // Render
  // ======================================================

  return (
    <div>
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
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Order #{order.orderNumber}
              </h1>

              <OrderStatus status={order.orderStatus} />
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Placed on {formattedDate}
            </p>
          </div>

          {order.orderStatus === "delivered" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={22} />

              <span className="text-sm font-semibold">Delivered</span>
            </div>
          )}
        </div>
      </section>

      {/* Main */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_400px]">
        {/* Left */}
        <div className="space-y-5">
          {/* ==================================================
              Products
              ================================================== */}

          <OrderProduct items={orderItems} />

          {/* ==================================================
              Order Details
              ================================================== */}

          <OrderDetails
            shippingAddress={order.shippingAddress}
            deliveryContact={order.deliveryContact}
            pricing={order.pricing}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
          />
        </div>

        {/* Right */}
        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          {/* Status Card */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Order Status
            </h2>

            <div className="mt-4">
              <OrderStatus status={order.orderStatus} />
            </div>

            {/* ==================================================
                Item Resolution Summary
                ================================================== */}

            <div className="mt-5 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Item Status
              </h3>

              <div className="mt-3 space-y-3">
                {order.products?.length > 0 ? (
                  order.products.map((product, index) => (
                    <div
                      key={`${product.productId}-${index}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <p className="min-w-0 flex-1 truncate text-sm text-gray-600">
                        {product.name}
                      </p>

                      <OrderStatus status={product.orderStatus} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No products found.</p>
                )}
              </div>
            </div>

            {/* Cancel Error */}
            {cancelError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {cancelError}
              </div>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-500 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Entire Order"
                )}
              </button>
            )}
          </section>

          {/* Continue Shopping */}
          <Link
            href="/groceries"
            className="flex h-11 w-full items-center justify-center rounded-lg bg-green-600 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
