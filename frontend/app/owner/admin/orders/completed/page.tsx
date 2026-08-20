"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, PackageCheck } from "lucide-react";
import adminApi from "@/lib/adminApi";

interface Customer {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
}

interface Seller {
  _id: string;
  shopName?: string;
}

interface DeliveryPartner {
  _id: string;
  name?: string;
  email?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

interface Product {
  _id: string;
  productName?: string;
  slug?: string;
}

interface OrderItem {
  _id?: string;
  product?: Product;
  seller?: Seller;
  deliveryPartner?: DeliveryPartner | null;

  quantity?: number;
  price?: number;
  totalPrice?: number;

  orderStatus?: string;
  deliveredAt?: string;
}

interface AdminOrder {
  _id: string;
  orderNumber?: string;

  customer?: Customer | null;

  items?: OrderItem[];

  orderStatus: string;

  paymentStatus?: string;
  paymentMethod?: string;

  totalAmount?: number;
  grandTotal?: number;
  total?: number;

  createdAt: string;
  updatedAt?: string;
}

interface CompletedOrdersResponse {
  success: boolean;
  page: number;
  limit: number;
  totalOrders: number;
  totalPages: number;
  orders: AdminOrder[];
}

const formatStatus = (status: string) => {
  switch (status) {
    case "ordered":
      return "Ordered";

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-700";

    case "confirmed":
      return "bg-green-100 text-green-700";

    case "outForDelivery":
      return "bg-blue-100 text-blue-700";

    case "ordered":
      return "bg-yellow-100 text-yellow-700";

    case "notAvailable":
      return "bg-orange-100 text-orange-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) {
    return "Unknown Date";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown Date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const getOrderAmount = (order: AdminOrder) => {
  if (typeof order.totalAmount === "number") {
    return order.totalAmount;
  }

  if (typeof order.grandTotal === "number") {
    return order.grandTotal;
  }

  if (typeof order.total === "number") {
    return order.total;
  }

  if (order.items?.length) {
    return order.items.reduce((sum, item) => {
      if (typeof item.totalPrice === "number") {
        return sum + item.totalPrice;
      }

      if (typeof item.price === "number" && typeof item.quantity === "number") {
        return sum + item.price * item.quantity;
      }

      return sum;
    }, 0);
  }

  return 0;
};

const getSellerNames = (order: AdminOrder) => {
  const sellers = new Map<string, string>();

  order.items?.forEach((item) => {
    if (item.seller?._id) {
      sellers.set(item.seller._id, item.seller.shopName || "Unknown Seller");
    }
  });

  if (sellers.size === 0) {
    return "-";
  }

  return Array.from(sellers.values()).join(", ");
};

const getDeliveryPartnerNames = (order: AdminOrder) => {
  const partners = new Map<string, string>();

  order.items?.forEach((item) => {
    const partner = item.deliveryPartner;

    if (!partner?._id) {
      return;
    }

    const partnerName =
      partner.name || partner.userId?.name || "Delivery Partner";

    partners.set(partner._id, partnerName);
  });

  if (partners.size === 0) {
    return "-";
  }

  return Array.from(partners.values()).join(", ");
};

const getSearchableText = (order: AdminOrder) => {
  const orderId = order.orderNumber || order._id || "";

  const customerName = order.customer?.name || "";

  const customerEmail = order.customer?.email || "";

  const customerMobile = order.customer?.mobile || "";

  const sellerNames = getSellerNames(order);

  const deliveryPartnerNames = getDeliveryPartnerNames(order);

  return [
    orderId,
    customerName,
    customerEmail,
    customerMobile,
    sellerNames,
    deliveryPartnerNames,
  ]
    .join(" ")
    .toLowerCase();
};

export default function CompletedOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalOrders, setTotalOrders] = useState(0);

  const LIMIT = 100;

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminApi.get<CompletedOrdersResponse>(
          "/admin/orders/completed",
          {
            params: {
              page,
              limit: LIMIT,
            },
          },
        );

        if (!response.data.success || !Array.isArray(response.data.orders)) {
          throw new Error("Failed to fetch completed orders.");
        }

        /*
         * Backend endpoint already returns:
         *
         * orderStatus = delivered
         *
         * Keep frontend safety filter.
         */

        const completedOrders = response.data.orders.filter(
          (order) => order.orderStatus === "delivered",
        );

        setOrders(completedOrders);

        setTotalOrders(response.data.totalOrders ?? completedOrders.length);

        setTotalPages(response.data.totalPages || 1);
      } catch (err) {
        console.error("Fetch Completed Admin Orders Error:", err);

        setError(
          "Failed to load completed orders. Please refresh the page and try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedOrders();
  }, [page]);

  /*
   * Search
   */

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return orders;
    }

    return orders.filter((order) =>
      getSearchableText(order).includes(searchValue),
    );
  }, [orders, search]);

  /*
   * Group orders by created date
   */

  const groupedOrders = useMemo(() => {
    const groups: Record<string, AdminOrder[]> = {};

    filteredOrders.forEach((order) => {
      const date = formatDate(order.createdAt);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(order);
    });

    /*
     * Newest orders first inside each date.
     */

    Object.values(groups).forEach((dateOrders) => {
      dateOrders.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    });

    /*
     * Newest date first.
     */

    return Object.entries(groups).sort(([, ordersA], [, ordersB]) => {
      const latestA = new Date(ordersA[0].createdAt).getTime();

      const latestB = new Date(ordersB[0].createdAt).getTime();

      return latestB - latestA;
    });
  }, [filteredOrders]);

  /*
   * Reset page when search changes.
   */

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <PackageCheck size={30} className="text-green-600" />

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Completed Orders
            </h1>
          </div>

          <p className="text-gray-500 mt-1 text-sm md:text-base">
            View all delivered marketplace orders.
          </p>
        </div>

        <Link
          href="/owner/admin/orders"
          className="inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 transition text-gray-700 px-4 py-2.5 rounded-lg font-medium"
        >
          <ArrowLeft size={18} />
          Active Orders
        </Link>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by Order ID, Customer or Seller..."
            className="w-full border rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      {/* Loading */}

      {loading && (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <p className="text-gray-500">Loading completed orders...</p>
        </div>
      )}

      {/* Error */}

      {!loading && error && (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Empty */}

      {!loading && !error && groupedOrders.length === 0 && (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <p className="text-gray-600 font-medium">
            {search
              ? "No completed orders found matching your search."
              : "No completed orders available."}
          </p>
        </div>
      )}

      {/* Date Groups */}

      {!loading && !error && groupedOrders.length > 0 && (
        <div className="space-y-8">
          {groupedOrders.map(([date, dateOrders]) => (
            <section key={date} className="space-y-3">
              {/* Date */}

              <div className="flex items-center gap-3">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 whitespace-nowrap">
                  {date}
                </h2>

                <div className="h-px bg-gray-300 flex-1" />

                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {dateOrders.length}{" "}
                  {dateOrders.length === 1 ? "order" : "orders"}
                </span>
              </div>

              {/* Orders Table */}

              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left px-2 md:px-3 py-3 whitespace-nowrap">
                          Order ID
                        </th>

                        <th className="text-left px-2 md:px-3 py-3 whitespace-nowrap">
                          Customer
                        </th>

                        <th className="text-left px-2 md:px-3 py-3 whitespace-nowrap">
                          Seller
                        </th>

                        <th className="text-left px-2 md:px-3 py-3 whitespace-nowrap">
                          Delivery Partner
                        </th>

                        <th className="text-left px-2 md:px-3 py-3 whitespace-nowrap">
                          Amount
                        </th>

                        <th className="text-left px-2 md:px-3 py-3 whitespace-nowrap">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {dateOrders.map((order) => (
                        <tr
                          key={order._id}
                          className="border-t hover:bg-green-50 transition"
                        >
                          {/* Order ID */}
                          <td className="p-0 font-semibold whitespace-nowrap">
                            <Link
                              href={`/owner/admin/orders/${order._id}`}
                              className="block px-2 md:px-3 py-4 w-full h-full text-gray-900"
                            >
                              {order.orderNumber || `#${order._id}`}
                            </Link>
                          </td>

                          {/* Customer */}
                          <td className="p-0">
                            <Link
                              href={`/owner/admin/orders/${order._id}`}
                              className="block px-2 md:px-3 py-4 w-full h-full"
                            >
                              <p className="font-medium text-gray-800">
                                {order.customer?.name || "-"}
                              </p>
                              {order.customer?.mobile && (
                                <p className="text-xs text-gray-500">
                                  {order.customer.mobile}
                                </p>
                              )}
                            </Link>
                          </td>

                          {/* Seller */}
                          <td className="p-0">
                            <Link
                              href={`/owner/admin/orders/${order._id}`}
                              className="block px-2 md:px-3 py-4 w-full h-full text-gray-700"
                            >
                              {getSellerNames(order)}
                            </Link>
                          </td>

                          {/* Delivery Partner */}
                          <td className="p-0">
                            <Link
                              href={`/owner/admin/orders/${order._id}`}
                              className="block px-2 md:px-3 py-4 w-full h-full text-gray-700"
                            >
                              {getDeliveryPartnerNames(order)}
                            </Link>
                          </td>

                          {/* Amount */}
                          <td className="p-0 font-medium whitespace-nowrap">
                            <Link
                              href={`/owner/admin/orders/${order._id}`}
                              className="block px-2 md:px-3 py-4 w-full h-full text-gray-900"
                            >
                              {formatCurrency(getOrderAmount(order))}
                            </Link>
                          </td>

                          {/* Status */}
                          <td className="p-0 whitespace-nowrap">
                            <Link
                              href={`/owner/admin/orders/${order._id}`}
                              className="block px-2 md:px-3 py-4 w-full h-full"
                            >
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(
                                  order.orderStatus,
                                )}`}
                              >
                                {formatStatus(order.orderStatus)}
                              </span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Pagination */}

      {!loading && !error && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing {orders.length} completed orders from this page
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Previous
            </button>

            <span className="px-3 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
              className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
