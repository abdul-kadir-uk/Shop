// app/seller/grocery/orders/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

type OrderStatus = "ordered" | "confirmed" | "notAvailable";

type SellerOrderVariant = {
  quantity: number;
  unit: string;
  label: string;
};

type SellerOrderItem = {
  product: string;
  productName: string;
  image?: string;
  quantity: number;
  variant?: SellerOrderVariant | null;
  price: number;
  discountPrice?: number | null;
  subtotal: number;
  orderStatus: OrderStatus;
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

type OrdersResponse = {
  success: boolean;
  page: number;
  limit: number;
  totalOrders: number;
  totalPages: number;
  orders: SellerOrder[];
};

type OrderTab = "ordered" | "completed";

const ORDERS_PER_PAGE = 10;

export default function GroceryOrdersPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<OrderTab>("ordered");

  const [orders, setOrders] = useState<SellerOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Keep page separately for each tab
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const currentPage = activeTab === "ordered" ? pendingPage : completedPage;

  const fetchOrders = useCallback(
    async (page: number = currentPage) => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<OrdersResponse>("/seller/orders", {
          params: {
            status: activeTab,
            page,
            limit: ORDERS_PER_PAGE,
          },
        });

        if (response.data.success) {
          setOrders(response.data.orders);
          setTotalPages(response.data.totalPages);

          // Keep backend page as source of truth
          if (activeTab === "ordered") {
            setPendingPage(response.data.page);
          } else {
            setCompletedPage(response.data.page);
          }
        } else {
          setOrders([]);
          setTotalPages(1);
          setError("Failed to load orders.");
        }
      } catch (error) {
        console.error("Fetch Seller Orders Error:", error);

        setOrders([]);
        setTotalPages(1);
        setError("Unable to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, currentPage],
  );

  useEffect(() => {
    fetchOrders(currentPage);
  }, [activeTab]);

  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab);
    setError("");
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || loading) {
      return;
    }

    if (activeTab === "ordered") {
      setPendingPage(page);
    } else {
      setCompletedPage(page);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchOrders(currentPage);
    }
  }, [pendingPage, completedPage]);

  const updateOrderStatus = async (
    orderId: string,
    status: "confirmed" | "notAvailable",
  ) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      await api.patch(`/seller/orders/${orderId}/status`, {
        status,
      });

      /*
       * Refresh the current page after updating.
       *
       * If the last order on the current page was moved
       * out of Pending, the backend may return an empty page.
       * In that case, move back one page automatically.
       */
      const response = await api.get<OrdersResponse>("/seller/orders", {
        params: {
          status: activeTab,
          page: currentPage,
          limit: ORDERS_PER_PAGE,
        },
      });

      if (
        response.data.success &&
        response.data.orders.length === 0 &&
        currentPage > 1
      ) {
        handlePageChange(currentPage - 1);
      } else if (response.data.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Update Seller Order Status Error:", error);

      setError("Failed to update order status. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>

        <p className="text-gray-500 mt-1">
          View and manage your customer orders.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow border p-1 flex w-full sm:w-fit">
        <button
          type="button"
          onClick={() => handleTabChange("ordered")}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === "ordered"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Pending Orders
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("completed")}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === "completed"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Completed Orders
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Orders */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="text-gray-500 mt-4">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {activeTab === "ordered"
                ? "No Pending Orders"
                : "No Completed Orders"}
            </h2>

            <p className="text-gray-500 mt-2">
              {activeTab === "ordered"
                ? "New orders will appear here when customers purchase your products."
                : "Confirmed or unavailable orders will appear here."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                      Order
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                      Products
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                      Total
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                      Payment
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() =>
                        router.push(`/seller/grocery/orders/${order._id}`)
                      }
                      className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          #{order.orderNumber}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {order._id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div
                              key={`${item.product}-${index}`}
                              className="flex items-center gap-3"
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="w-10 h-10 rounded-lg object-cover border"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 border flex items-center justify-center text-xs text-gray-400">
                                  N/A
                                </div>
                              )}

                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.productName}
                                </p>

                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity}
                                  {item.variant?.label
                                    ? ` • ${item.variant.label}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        ₹{order.sellerTotal}
                      </td>

                      <td className="px-5 py-4">
                        <span className="capitalize text-sm">
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <span
                              key={`${item.product}-${index}-status`}
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium mr-1 ${getStatusClasses(
                                item.orderStatus,
                              )}`}
                            >
                              {getStatusLabel(item.orderStatus)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {activeTab === "ordered" ? (
                          <div className="flex flex-col gap-2 min-w-35">
                            <button
                              type="button"
                              disabled={updatingOrderId === order._id}
                              onClick={(e) => {
                                e.stopPropagation();

                                updateOrderStatus(order._id, "confirmed");
                              }}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                              {updatingOrderId === order._id
                                ? "Updating..."
                                : "Confirm"}
                            </button>

                            <button
                              type="button"
                              disabled={updatingOrderId === order._id}
                              onClick={(e) => {
                                e.stopPropagation();

                                updateOrderStatus(order._id, "notAvailable");
                              }}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                              Not Available
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() =>
                    router.push(`/seller/grocery/orders/${order._id}`)
                  }
                  className="p-4 space-y-4 cursor-pointer hover:bg-gray-50 transition"
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        #{order.orderNumber}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-gray-900">
                      ₹{order.sellerTotal}
                    </span>
                  </div>

                  {/* Payment */}
                  <div className="text-sm">
                    <span className="text-gray-500">Payment: </span>

                    <span className="capitalize font-medium">
                      {order.paymentStatus}
                    </span>
                  </div>

                  {/* Products */}
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.product}-${index}`}
                        className="flex gap-3"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-14 h-14 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 border flex items-center justify-center text-xs text-gray-400">
                            N/A
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {item.productName}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            Qty: {item.quantity}
                            {item.variant?.label
                              ? ` • ${item.variant.label}`
                              : ""}
                          </p>

                          <div className="mt-2">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                                item.orderStatus,
                              )}`}
                            >
                              {getStatusLabel(item.orderStatus)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {activeTab === "ordered" && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        disabled={updatingOrderId === order._id}
                        onClick={(e) => {
                          e.stopPropagation();

                          updateOrderStatus(order._id, "confirmed");
                        }}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-lg text-sm font-medium transition"
                      >
                        {updatingOrderId === order._id
                          ? "Updating..."
                          : "Confirm"}
                      </button>

                      <button
                        type="button"
                        disabled={updatingOrderId === order._id}
                        onClick={(e) => {
                          e.stopPropagation();

                          updateOrderStatus(order._id, "notAvailable");
                        }}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-lg text-sm font-medium transition"
                      >
                        Not Available
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>

                <div className="text-sm text-gray-600">
                  Page{" "}
                  <span className="font-semibold text-gray-900">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {totalPages}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
