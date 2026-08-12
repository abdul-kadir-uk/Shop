// app/seller/grocery/orders/[orderId]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";

import api from "@/lib/api";

type OrderStatus =
  | "ordered"
  | "confirmed"
  | "notAvailable"
  | "outForDelivery"
  | "delivered"
  | "cancelled";

type SellerOrderVariant = {
  quantity: number;
  unit: string;
  label: string;
};

type SellerOrderItem = {
  product: string;
  productName: string;
  image?: string;
  variant?: SellerOrderVariant | null;
  quantity: number;
  price: number;
  discountPrice?: number | null;
  orderStatus: OrderStatus;
  subtotal: number;
};

type SellerOrder = {
  _id: string;
  orderNumber: string;
  paymentStatus: string;
  createdAt: string;
  sellerTotal: number;
  totalItems: number;
  items: SellerOrderItem[];
};

type SellerOrderResponse = {
  success: boolean;
  order: SellerOrder;
};

export default function SellerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params.orderId as string;

  const [order, setOrder] = useState<SellerOrder | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<SellerOrderResponse>(
        `/seller/orders/${orderId}`,
      );

      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError("Failed to load order details.");
      }
    } catch (error) {
      console.error("Fetch Seller Order Details Error:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

        setError(
          axiosError.response?.data?.message || "Failed to load order details.",
        );
      } else {
        setError("Failed to load order details.");
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const updateOrderStatus = async (status: "confirmed" | "notAvailable") => {
    try {
      setUpdating(true);
      setError("");

      await api.patch(`/seller/orders/${orderId}/status`, {
        status,
      });

      // Fetch the updated order
      await fetchOrder();
    } catch (error) {
      console.error("Update Seller Order Status Error:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

        setError(
          axiosError.response?.data?.message ||
            "Failed to update order status.",
        );
      } else {
        setError("Failed to update order status.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "ordered":
        return "Pending";

      case "confirmed":
        return "Confirmed";

      case "notAvailable":
        return "Not Available";

      case "outForDelivery":
        return "Out for Delivery";

      case "delivered":
        return "Delivered";

      case "cancelled":
        return "Cancelled";

      default:
        return status;
    }
  };

  const getStatusClasses = (status: OrderStatus) => {
    switch (status) {
      case "ordered":
        return "bg-yellow-100 text-yellow-700";

      case "confirmed":
        return "bg-green-100 text-green-700";

      case "notAvailable":
        return "bg-red-100 text-red-700";

      case "outForDelivery":
        return "bg-blue-100 text-blue-700";

      case "delivered":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />

        <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />

        <div className="bg-white rounded-xl shadow border p-8">
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * Error / Not Found
   */
  if (error || !order) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push("/seller/grocery/orders")}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </button>

        <div className="bg-white rounded-xl shadow border p-8 text-center">
          <Package size={48} className="mx-auto text-gray-400" />

          <h2 className="text-xl font-semibold text-gray-900 mt-4">
            Unable to load order
          </h2>

          <p className="text-gray-500 mt-2">{error || "Order not found."}</p>

          <button
            type="button"
            onClick={fetchOrder}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isPending = order.items.some((item) => item.orderStatus === "ordered");

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/seller/grocery/orders")}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
      >
        <ArrowLeft size={18} />
        Back to Orders
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Order Details
        </h1>

        <p className="text-gray-500 mt-1">
          View complete information about this order.
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                #{order.orderNumber}
              </h2>

              <p className="text-xs text-gray-500 mt-1 break-all">
                Order ID: {order._id}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500">Order Date</p>

              <p className="font-medium text-gray-900 mt-1">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
          <div className="p-5">
            <p className="text-sm text-gray-500">Total Items</p>

            <p className="text-xl font-bold text-gray-900 mt-1">
              {order.totalItems}
            </p>
          </div>

          <div className="p-5">
            <p className="text-sm text-gray-500">Payment Status</p>

            <p className="text-xl font-bold capitalize text-gray-900 mt-1">
              {order.paymentStatus}
            </p>
          </div>

          <div className="p-5">
            <p className="text-sm text-gray-500">Seller Total</p>

            <p className="text-xl font-bold text-gray-900 mt-1">
              ₹{order.sellerTotal}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Products */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Ordered Products
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Products included in this seller order.
          </p>
        </div>

        <div className="divide-y">
          {order.items.map((item, index) => (
            <div key={`${item.product}-${index}`} className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Image */}
                <div className="shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gray-100 border flex items-center justify-center">
                      <Package size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.productName}
                      </h3>

                      <p className="text-xs text-gray-400 mt-1 break-all">
                        Product ID: {item.product}
                      </p>
                    </div>

                    <span
                      className={`w-fit px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                        item.orderStatus,
                      )}`}
                    >
                      {getStatusLabel(item.orderStatus)}
                    </span>
                  </div>

                  {/* Product details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>

                      <p className="font-medium text-gray-900 mt-1">
                        {item.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Variant</p>

                      <p className="font-medium text-gray-900 mt-1">
                        {item.variant?.label || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Price</p>

                      <p className="font-medium text-gray-900 mt-1">
                        ₹{item.discountPrice ?? item.price}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Subtotal</p>

                      <p className="font-semibold text-gray-900 mt-1">
                        ₹{item.subtotal}
                      </p>
                    </div>
                  </div>

                  {/* Variant */}
                  {item.variant && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                      Variant:{" "}
                      <span className="font-medium text-gray-900">
                        {item.variant.label}
                      </span>
                      <span className="mx-2">•</span>
                      Quantity:{" "}
                      <span className="font-medium text-gray-900">
                        {item.variant.quantity}
                      </span>
                      <span className="mx-2">•</span>
                      Unit:{" "}
                      <span className="font-medium text-gray-900">
                        {item.variant.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t bg-gray-50 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-semibold text-gray-700">
              Seller Total
            </span>

            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              ₹{order.sellerTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Seller Actions */}
      {isPending && (
        <div className="bg-white rounded-xl shadow border p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Order Action</h2>

          <p className="text-sm text-gray-500 mt-1">
            Review the order and choose whether you can fulfill it.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              disabled={updating}
              onClick={() => updateOrderStatus("confirmed")}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition"
            >
              {updating ? "Updating..." : "Confirm Order"}
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() => updateOrderStatus("notAvailable")}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition"
            >
              {updating ? "Updating..." : "Not Available"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
