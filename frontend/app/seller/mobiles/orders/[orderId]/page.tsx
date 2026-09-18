// app/seller/mobiles/orders/[orderId]/page.tsx
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

type SellerMobileOrderVariant = {
  variantGroupId?: string;
  variantName?: string;
  ram?: string;
  storage?: string;
};

type SellerMobileOrderItem = {
  product: string;
  productName: string;
  brand?: string;
  image?: string;
  quantity: number;
  variant?: SellerMobileOrderVariant | null;
  color?: string;
  colorPrice?: number | null;
  price: number;
  discountPrice?: number | null;
  subtotal: number;
  orderStatus: OrderStatus;
};

type SellerMobileOrder = {
  _id: string;
  orderNumber: string;
  paymentStatus: string;
  createdAt: string;
  sellerTotal: number;
  totalItems: number;
  items: SellerMobileOrderItem[];
};

type SellerMobileOrderResponse = {
  success: boolean;
  order: SellerMobileOrder;
};

type UpdateStatus = "confirmed" | "notAvailable";

export default function SellerMobileOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params.orderId as string;

  const [order, setOrder] = useState<SellerMobileOrder | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Stores which action is currently running.
   *
   * Examples:
   * "all-confirmed"
   * "all-notAvailable"
   * "item-0-confirmed"
   * "item-2-notAvailable"
   */
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  // ======================================================
  // FETCH ORDER
  // ======================================================

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<SellerMobileOrderResponse>(
        `/seller/mobile-orders/${orderId}`,
      );

      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError("Failed to load order details.");
      }
    } catch (error) {
      console.error("Fetch Mobile Seller Order Details Error:", error);

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

  // ======================================================
  // UPDATE ORDER STATUS
  //
  // itemIndex provided:
  //     update ONE item
  //
  // itemIndex omitted:
  //     update ALL pending items belonging to this seller
  // ======================================================

  const updateOrderStatus = async (
    status: UpdateStatus,
    itemIndex?: number,
  ) => {
    const actionKey =
      itemIndex === undefined ? `all-${status}` : `item-${itemIndex}-${status}`;

    try {
      setUpdatingAction(actionKey);
      setError("");

      const payload: {
        status: UpdateStatus;
        itemIndex?: number;
      } = {
        status,
      };

      // Only send itemIndex for individual item updates.
      if (itemIndex !== undefined) {
        payload.itemIndex = itemIndex;
      }

      await api.patch(`/seller/mobile-orders/${orderId}/status`, payload);

      // Refresh order after successful update.
      await fetchOrder();
    } catch (error) {
      console.error("Update Mobile Seller Order Status Error:", error);

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
      setUpdatingAction(null);
    }
  };

  // ======================================================
  // HELPERS
  // ======================================================

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
   * IMPORTANT:
   *
   * These prices are historical snapshots saved in the order.
   *
   * Priority:
   *
   * 1. Valid colorPrice
   * 2. Valid discountPrice when there is no colorPrice
   * 3. Original price
   */
  const getItemSellingPrice = (item: SellerMobileOrderItem) => {
    const originalPrice = Number(item.price);

    const hasColorPrice =
      item.colorPrice !== null &&
      item.colorPrice !== undefined &&
      Number(item.colorPrice) > 0;

    const currentColorPrice = hasColorPrice ? Number(item.colorPrice) : null;

    const currentDiscountPrice =
      hasColorPrice && currentColorPrice! < originalPrice
        ? currentColorPrice
        : !hasColorPrice &&
            item.discountPrice !== null &&
            item.discountPrice !== undefined &&
            Number(item.discountPrice) > 0 &&
            Number(item.discountPrice) < originalPrice
          ? Number(item.discountPrice)
          : null;

    return hasColorPrice
      ? currentColorPrice!
      : (currentDiscountPrice ?? originalPrice);
  };

  const hasItemDiscount = (item: SellerMobileOrderItem) => {
    const originalPrice = Number(item.price);
    const sellingPrice = getItemSellingPrice(item);

    return sellingPrice < originalPrice;
  };

  // ======================================================
  // LOADING
  // ======================================================

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

  // ======================================================
  // ERROR / NOT FOUND
  // ======================================================

  if (error || !order) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push("/seller/mobiles/orders")}
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

  // ======================================================
  // PENDING ITEMS
  // ======================================================

  const pendingItems = order.items.filter(
    (item) => item.orderStatus === "ordered",
  );

  const hasPendingItems = pendingItems.length > 0;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="space-y-6">
      {/* ==================================================
          BACK
      ================================================== */}

      <button
        type="button"
        onClick={() => router.push("/seller/mobiles/orders")}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
      >
        <ArrowLeft size={18} />
        Back to Orders
      </button>

      {/* ==================================================
          HEADER
      ================================================== */}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Order Details
        </h1>

        <p className="text-gray-500 mt-1">
          View complete information about this mobile order.
        </p>
      </div>

      {/* ==================================================
          ORDER SUMMARY
      ================================================== */}

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

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* ==================================================
          PRODUCTS
      ================================================== */}

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Ordered Mobiles
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Mobile products included in this seller order.
          </p>
        </div>

        <div className="divide-y">
          {order.items.map((item, index) => {
            const isItemPending = item.orderStatus === "ordered";

            const confirmItemAction = `item-${index}-confirmed`;
            const unavailableItemAction = `item-${index}-notAvailable`;

            const isConfirmingItem = updatingAction === confirmItemAction;

            const isRejectingItem = updatingAction === unavailableItemAction;

            const sellingPrice = getItemSellingPrice(item);
            const hasDiscount = hasItemDiscount(item);

            return (
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

                        {item.brand && (
                          <p className="text-sm text-gray-600 mt-1">
                            Brand:{" "}
                            <span className="font-medium text-gray-900">
                              {item.brand}
                            </span>
                          </p>
                        )}

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

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5">
                      <div>
                        <p className="text-xs text-gray-500">Quantity</p>

                        <p className="font-medium text-gray-900 mt-1">
                          {item.quantity}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">RAM</p>

                        <p className="font-medium text-gray-900 mt-1">
                          {item.variant?.ram || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Storage</p>

                        <p className="font-medium text-gray-900 mt-1">
                          {item.variant?.storage || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Color</p>

                        <p className="font-medium text-gray-900 mt-1">
                          {item.color || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Subtotal</p>

                        <p className="font-semibold text-gray-900 mt-1">
                          ₹{item.subtotal}
                        </p>
                      </div>
                    </div>

                    {/* Pricing */}

                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-2">
                        Price Details
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {hasDiscount && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹{item.price}
                          </span>
                        )}

                        <span className="font-semibold text-gray-900">
                          ₹{sellingPrice}
                        </span>

                        {item.colorPrice !== null &&
                          item.colorPrice !== undefined &&
                          Number(item.colorPrice) > 0 && (
                            <span className="text-xs text-gray-500">
                              Color price
                            </span>
                          )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        {item.quantity} × ₹{sellingPrice} = ₹{item.subtotal}
                      </p>
                    </div>

                    {/* Variant */}

                    {item.variant && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                        Variant:{" "}
                        <span className="font-medium text-gray-900">
                          {item.variant.variantName || "—"}
                        </span>
                        {item.variant.ram && (
                          <>
                            <span className="mx-2">•</span>
                            RAM:{" "}
                            <span className="font-medium text-gray-900">
                              {item.variant.ram}
                            </span>
                          </>
                        )}
                        {item.variant.storage && (
                          <>
                            <span className="mx-2">•</span>
                            Storage:{" "}
                            <span className="font-medium text-gray-900">
                              {item.variant.storage}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* ==================================================
                        INDIVIDUAL ITEM ACTIONS
                    ================================================== */}

                    {isItemPending && (
                      <div className="mt-5 border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Update this item
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            disabled={updatingAction !== null}
                            onClick={() =>
                              updateOrderStatus("confirmed", index)
                            }
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium transition"
                          >
                            {isConfirmingItem
                              ? "Confirming..."
                              : "Confirm This Item"}
                          </button>

                          <button
                            type="button"
                            disabled={updatingAction !== null}
                            onClick={() =>
                              updateOrderStatus("notAvailable", index)
                            }
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium transition"
                          >
                            {isRejectingItem ? "Updating..." : "Not Available"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ==================================================
            TOTAL
        ================================================== */}

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

      {/* ==================================================
          BULK SELLER ACTIONS
      ================================================== */}

      {hasPendingItems && (
        <div className="bg-white rounded-xl shadow border p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Update Entire Seller Order
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            These actions update all pending mobile items belonging to you in
            this order.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {/* Confirm ALL */}

            <button
              type="button"
              disabled={updatingAction !== null}
              onClick={() => updateOrderStatus("confirmed")}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition"
            >
              {updatingAction === "all-confirmed"
                ? "Confirming All..."
                : "Confirm Entire Order"}
            </button>

            {/* Not Available ALL */}

            <button
              type="button"
              disabled={updatingAction !== null}
              onClick={() => updateOrderStatus("notAvailable")}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition"
            >
              {updatingAction === "all-notAvailable"
                ? "Updating All..."
                : "Mark Entire Order Not Available"}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            {pendingItems.length} pending item
            {pendingItems.length !== 1 ? "s" : ""} will be updated.
          </p>
        </div>
      )}
    </div>
  );
}
