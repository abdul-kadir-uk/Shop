"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  User,
  Store,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
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
  address?: unknown;
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
  assignedCities?: unknown[];
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

interface ShippingAddress {
  name?: string;
  mobile?: string;
  phone?: string;
  address?: string;
  city?: {
    _id?: string;
    name?: string;
  };
  state?: string;
  pincode?: string;
  postalCode?: string;
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

  shippingAddress?: ShippingAddress;

  createdAt: string;
  updatedAt?: string;
}

interface SingleOrderResponse {
  success: boolean;
  order: AdminOrder;
}

interface UpdateOrderResponse {
  success: boolean;
  message: string;
  order: AdminOrder;
}

const ORDER_STATUSES = [
  "ordered",
  "confirmed",
  "notAvailable",
  "outForDelivery",
  "delivered",
  "cancelled",
];

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
    case "ordered":
      return "bg-yellow-100 text-yellow-700";

    case "confirmed":
      return "bg-green-100 text-green-700";

    case "notAvailable":
      return "bg-orange-100 text-orange-700";

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

const formatDateTime = (dateString?: string) => {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
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

const getPartnerName = (partner?: DeliveryPartner | null) => {
  if (!partner) {
    return "-";
  }

  return partner.name || partner.userId?.name || "Delivery Partner";
};

const getPartnerEmail = (partner?: DeliveryPartner | null) => {
  if (!partner) {
    return "-";
  }

  return partner.email || partner.userId?.email || "-";
};

const getUniqueSellers = (items: OrderItem[] = []) => {
  const sellers = new Map<string, Seller>();

  items.forEach((item) => {
    if (item.seller?._id) {
      sellers.set(item.seller._id, item.seller);
    }
  });

  return Array.from(sellers.values());
};

const getUniqueDeliveryPartners = (items: OrderItem[] = []) => {
  const partners = new Map<string, DeliveryPartner>();

  items.forEach((item) => {
    if (item.deliveryPartner?._id) {
      partners.set(item.deliveryPartner._id, item.deliveryPartner);
    }
  });

  return Array.from(partners.values());
};

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params.orderId as string;

  const [order, setOrder] = useState<AdminOrder | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);

  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminApi.get<SingleOrderResponse>(
          `/admin/orders/${orderId}`,
        );

        if (!response.data.success || !response.data.order) {
          throw new Error("Order not found.");
        }

        setOrder(response.data.order);

        setSelectedStatus(response.data.order.orderStatus);
      } catch (err) {
        console.error("Fetch Admin Order Error:", err);

        setError("Failed to load order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!order) {
      return;
    }

    if (!selectedStatus) {
      return;
    }

    if (selectedStatus === order.orderStatus) {
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccessMessage("");

      const response = await adminApi.patch<UpdateOrderResponse>(
        `/admin/orders/${order._id}/status`,
        {
          status: selectedStatus,
        },
      );

      if (!response.data.success || !response.data.order) {
        throw new Error("Failed to update order status.");
      }

      setOrder(response.data.order);

      setSelectedStatus(response.data.order.orderStatus);

      setSuccessMessage(
        response.data.message || "Order status updated successfully.",
      );
    } catch (err) {
      console.error("Update Admin Order Status Error:", err);

      setError("Failed to update order status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-10 text-center">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="space-y-6">
        <Link
          href="/owner/admin/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        <div className="bg-white rounded-xl shadow p-10 text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          href="/owner/admin/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        <div className="bg-white rounded-xl shadow p-10 text-center">
          <p className="text-gray-600">Order not found.</p>
        </div>
      </div>
    );
  }

  const sellers = getUniqueSellers(order.items);

  const deliveryPartners = getUniqueDeliveryPartners(order.items);

  const shippingAddress = order.shippingAddress;

  return (
    <div className="space-y-6">
      {/* Back */}

      <Link
        href="/owner/admin/orders"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
      >
        <ArrowLeft size={18} />
        Back to Orders
      </Link>

      {/* Header */}

      <div className="bg-white rounded-xl shadow p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {order.orderNumber || `#${order._id}`}
              </h1>

              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.orderStatus,
                )}`}
              >
                {formatStatus(order.orderStatus)}
              </span>
            </div>

            <p className="text-gray-500 mt-2 text-sm">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>

          {/* Status Control */}

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              disabled={updating}
              className="border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={updating || selectedStatus === order.orderStatus}
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-white px-5 py-2.5 rounded-lg font-medium"
            >
              <CheckCircle2 size={18} />

              {updating ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>

        {/* Success */}

        {successMessage && (
          <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            {successMessage}
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Order Summary */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
              <Package size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Order Total</p>

              <p className="font-bold text-lg text-gray-800">
                {formatCurrency(getOrderAmount(order))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 text-purple-600 p-2.5 rounded-lg">
              <CreditCard size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Payment</p>

              <p className="font-bold text-gray-800">
                {order.paymentMethod || "COD"}
              </p>

              {order.paymentStatus && (
                <p className="text-xs text-gray-500">{order.paymentStatus}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-600 p-2.5 rounded-lg">
              <User size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Customer</p>

              <p className="font-bold text-gray-800">
                {order.customer?.name || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 text-orange-600 p-2.5 rounded-lg">
              <Package size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Items</p>

              <p className="font-bold text-lg text-gray-800">
                {order.items?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer + Shipping */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer */}

        <div className="bg-white rounded-xl shadow p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
              <User size={21} />
            </div>

            <h2 className="text-lg font-bold text-gray-800">
              Customer Details
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>

              <p className="font-medium text-gray-800">
                {order.customer?.name || "-"}
              </p>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={16} className="text-gray-400" />

              <span>{order.customer?.email || "-"}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={16} className="text-gray-400" />

              <span>{order.customer?.mobile || "-"}</span>
            </div>
          </div>
        </div>

        {/* Shipping */}

        <div className="bg-white rounded-xl shadow p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-green-100 text-green-600 p-2.5 rounded-lg">
              <MapPin size={21} />
            </div>

            <h2 className="text-lg font-bold text-gray-800">
              Delivery Address
            </h2>
          </div>

          {shippingAddress ? (
            <div className="space-y-2 text-gray-700">
              {shippingAddress.name && (
                <p className="font-medium">{shippingAddress.name}</p>
              )}

              {shippingAddress.mobile && <p>{shippingAddress.mobile}</p>}

              {shippingAddress.phone && <p>{shippingAddress.phone}</p>}

              {shippingAddress.address && <p>{shippingAddress.address}</p>}

              {shippingAddress.city?.name && <p>{shippingAddress.city.name}</p>}

              {shippingAddress.state && <p>{shippingAddress.state}</p>}

              {(shippingAddress.pincode || shippingAddress.postalCode) && (
                <p>{shippingAddress.pincode || shippingAddress.postalCode}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Delivery address not available.</p>
          )}
        </div>
      </div>

      {/* Sellers */}

      <div className="bg-white rounded-xl shadow p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-purple-100 text-purple-600 p-2.5 rounded-lg">
            <Store size={21} />
          </div>

          <h2 className="text-lg font-bold text-gray-800">Sellers</h2>
        </div>

        {sellers.length === 0 ? (
          <p className="text-gray-500">Seller information not available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((seller) => (
              <div key={seller._id} className="border rounded-lg p-4">
                <p className="font-semibold text-gray-800">
                  {seller.shopName || "Unknown Seller"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Partners */}

      <div className="bg-white rounded-xl shadow p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-orange-100 text-orange-600 p-2.5 rounded-lg">
            <Truck size={21} />
          </div>

          <h2 className="text-lg font-bold text-gray-800">Delivery Partners</h2>
        </div>

        {deliveryPartners.length === 0 ? (
          <p className="text-gray-500">No delivery partner assigned.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliveryPartners.map((partner) => (
              <div key={partner._id} className="border rounded-lg p-4">
                <p className="font-semibold text-gray-800">
                  {getPartnerName(partner)}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {getPartnerEmail(partner)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Items */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-5 md:p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800">Order Items</h2>

          <p className="text-sm text-gray-500 mt-1">
            Individual item and seller information.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Product
                </th>

                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Seller
                </th>

                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Delivery Partner
                </th>

                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Quantity
                </th>

                <th className="text-left px-4 py-3 whitespace-nowrap">Price</th>

                <th className="text-left px-4 py-3 whitespace-nowrap">Total</th>

                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Item Status
                </th>
              </tr>
            </thead>

            <tbody>
              {order.items?.map((item, index) => (
                <tr
                  key={item._id || index}
                  className="border-t hover:bg-gray-50"
                >
                  {/* Product */}

                  <td className="px-4 py-4 min-w-45">
                    <p className="font-medium text-gray-800">
                      {item.product?.productName || "Product unavailable"}
                    </p>
                  </td>

                  {/* Seller */}

                  <td className="px-4 py-4 min-w-37">
                    {item.seller?.shopName || "-"}
                  </td>

                  {/* Delivery Partner */}

                  <td className="px-4 py-4 min-w-40">
                    {getPartnerName(item.deliveryPartner)}
                  </td>

                  {/* Quantity */}

                  <td className="px-4 py-4">{item.quantity ?? "-"}</td>

                  {/* Price */}

                  <td className="px-4 py-4 whitespace-nowrap">
                    {typeof item.price === "number"
                      ? formatCurrency(item.price)
                      : "-"}
                  </td>

                  {/* Total */}

                  <td className="px-4 py-4 font-medium whitespace-nowrap">
                    {typeof item.totalPrice === "number"
                      ? formatCurrency(item.totalPrice)
                      : typeof item.price === "number" &&
                          typeof item.quantity === "number"
                        ? formatCurrency(item.price * item.quantity)
                        : "-"}
                  </td>

                  {/* Item Status */}

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        item.orderStatus || "",
                      )}`}
                    >
                      {formatStatus(item.orderStatus || "-")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Navigation */}

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        <Link
          href="/owner/admin/orders"
          className="inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 transition px-5 py-2.5 rounded-lg font-medium text-gray-700"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        {order.orderStatus === "delivered" && (
          <Link
            href="/owner/admin/orders/completed"
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition text-white px-5 py-2.5 rounded-lg font-medium"
          >
            <CheckCircle2 size={18} />
            Completed Orders
          </Link>
        )}
      </div>
    </div>
  );
}
