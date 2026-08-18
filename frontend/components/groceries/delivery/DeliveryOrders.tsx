// components/groceries/delivery/DeliveryOrders.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  Truck,
  XCircle,
  Clock3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  acceptDeliveryOrder,
  getAvailableDeliveryOrders,
  getMyDeliveryOrders,
  updateDeliveryOrderStatus,
  type DeliveryOrder,
  type DeliveryOrderStatus,
} from "@/lib/deliveryApi";

import { useAuth } from "@/context/authContext";

type OrderTab = "available" | "pending" | "completed";

// ======================================================
// Main Component
// ======================================================

export default function DeliveryOrders() {
  const router = useRouter();

  const { loading: authLoading, isLoggedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<OrderTab>("available");

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");

  // ======================================================
  // Pagination
  // ======================================================

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // ======================================================
  // Fetch Orders
  // ======================================================

  const fetchOrders = async (
    tab: OrderTab = activeTab,
    page: number = currentPage,
  ) => {
    if (!isLoggedIn) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      let data;

      if (tab === "available") {
        data = await getAvailableDeliveryOrders(page);
      } else if (tab === "pending") {
        data = await getMyDeliveryOrders("pending", page);
      } else {
        data = await getMyDeliveryOrders("completed", page);
      }

      if (!data.success) {
        throw new Error("Failed to fetch orders.");
      }

      setOrders(data.orders || []);

      // ==================================================
      // Pagination
      // ==================================================

      if (data.pagination) {
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setHasNextPage(data.pagination.hasNextPage);
        setHasPreviousPage(data.pagination.hasPreviousPage);
      } else {
        const responseCurrentPage = data.page ?? page;
        const responseTotalPages = data.totalPages ?? 1;

        setCurrentPage(responseCurrentPage);
        setTotalPages(responseTotalPages);

        setHasNextPage(responseCurrentPage < responseTotalPages);
        setHasPreviousPage(responseCurrentPage > 1);
      }
    } catch (error: any) {
      console.error("Delivery Orders Error:", error);

      setOrders([]);

      const message =
        error?.response?.data?.message ||
        "Failed to load orders. Please try again.";

      setError(message);

      setCurrentPage(1);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPreviousPage(false);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Authentication / Initial Load / Tab Change
  // ======================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    setCurrentPage(1);

    fetchOrders(activeTab, 1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authLoading, isLoggedIn]);

  // ======================================================
  // Change Page
  // ======================================================

  const handlePageChange = (page: number) => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);

    fetchOrders(activeTab, page);
  };

  // ======================================================
  // Accept WHOLE Delivery Order
  // ======================================================

  const handleAcceptDelivery = async (orderId: string) => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    const actionKey = `accept-${orderId}`;

    try {
      setActionLoading(actionKey);
      setError("");

      await acceptDeliveryOrder(orderId);

      // Remove from Available immediately.
      setOrders((currentOrders) =>
        currentOrders.filter((order) => order._id !== orderId),
      );
    } catch (error: any) {
      console.error("Accept Delivery Error:", error);

      const message =
        error?.response?.data?.message || "Failed to accept this delivery.";

      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  // ======================================================
  // Update WHOLE Delivery Order Status
  // ======================================================

  const handleStatusUpdate = async (
    orderId: string,
    status: "outForDelivery" | "delivered" | "cancelled",
  ) => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    const actionKey = `${status}-${orderId}`;

    try {
      setActionLoading(actionKey);
      setError("");

      await updateDeliveryOrderStatus(orderId, status);

      // Refresh current tab after status change.
      await fetchOrders(activeTab, currentPage);
    } catch (error: any) {
      console.error("Update Delivery Status Error:", error);

      const message =
        error?.response?.data?.message || "Failed to update delivery status.";

      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

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
  // Orders Loading
  // ======================================================

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage available and assigned deliveries.
          </p>
        </div>

        <OrderTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="rounded-xl border bg-white p-10 shadow-sm">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
          </div>
        </div>
      </div>
    );
  }

  // ======================================================
  // Main UI
  // ======================================================

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage available and assigned deliveries.
        </p>
      </div>

      <OrderTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => {
              setError("");
              fetchOrders(activeTab, currentPage);
            }}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyOrders tab={activeTab} />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <DeliveryOrderCard
                key={order._id}
                order={order}
                activeTab={activeTab}
                actionLoading={actionLoading}
                onAccept={handleAcceptDelivery}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>

          <OrderPagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

// ======================================================
// Order Tabs
// ======================================================

interface OrderTabsProps {
  activeTab: OrderTab;
  setActiveTab: (tab: OrderTab) => void;
}

function OrderTabs({ activeTab, setActiveTab }: OrderTabsProps) {
  const tabs: {
    key: OrderTab;
    label: string;
  }[] = [
    {
      key: "available",
      label: "Available",
    },
    {
      key: "pending",
      label: "My Orders",
    },
    {
      key: "completed",
      label: "Completed",
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex w-max gap-2 rounded-xl border bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:py-2.5 sm:text-sm ${
                active
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// Delivery Order Card
// ======================================================

interface DeliveryOrderCardProps {
  order: DeliveryOrder;
  activeTab: OrderTab;
  actionLoading: string | null;

  onAccept: (orderId: string) => void;

  onStatusUpdate: (
    orderId: string,
    status: "outForDelivery" | "delivered" | "cancelled",
  ) => void;
}

function DeliveryOrderCard({
  order,
  activeTab,
  actionLoading,
  onAccept,
  onStatusUpdate,
}: DeliveryOrderCardProps) {
  const orderStatus = order.orderStatus;

  const acceptKey = `accept-${order._id}`;
  const outForDeliveryKey = `outForDelivery-${order._id}`;
  const deliveredKey = `delivered-${order._id}`;
  const cancelledKey = `cancelled-${order._id}`;

  const canStartDelivery = order.canStartDelivery === true;

  // ======================================================
  // Determine seller resolution
  // ======================================================

  const hasUnresolvedItems = order.items.some(
    (item) => item.orderStatus === "ordered",
  );

  const hasDeliverableItems = order.items.some(
    (item) => item.orderStatus === "confirmed",
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* ==================================================
          Order Header
      ================================================== */}

      <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">#{order.orderNumber}</h2>

          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
              orderStatus,
            )}`}
          >
            {statusLabels[orderStatus]}
          </span>

          <span className="text-xs text-gray-500">
            {order.items.length} item
            {order.items.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ==================================================
          Customer
      ================================================== */}

      <div className="border-b px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Customer</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <p className="font-medium text-gray-900">
            {order.customer?.name || "Customer"}
          </p>

          {order.customer?.mobile && (
            <p className="flex items-center gap-2">
              <Phone size={15} />
              {order.customer.mobile}
            </p>
          )}

          <p className="flex items-start gap-2">
            <MapPin size={15} className="mt-0.5 shrink-0" />

            <span>{formatAddress(order.shippingAddress)}</span>
          </p>
        </div>
      </div>

      {/* ==================================================
          Items
      ================================================== */}

      <div className="divide-y">
        {order.items.map((item, itemIndex) => {
          const status = item.orderStatus;

          const itemPrice = Number(item.price || 0);
          const itemQuantity = Number(item.quantity || 0);

          const totalPrice = itemPrice * itemQuantity;

          return (
            <div
              key={item._id || `${order._id}-${itemIndex}`}
              className="px-5 py-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <Package size={18} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-medium text-gray-900">
                        {item.product?.productName ||
                          item.productName ||
                          "Product"}
                      </h4>

                      {item.variant?.label && (
                        <p className="mt-1 text-xs text-gray-500">
                          Variant: {item.variant.label}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-500">
                        Quantity: {item.quantity}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        ₹{totalPrice.toFixed(2)}
                      </p>

                      {item.seller && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500">
                            Seller: {item.seller.shopName}
                          </p>

                          {item.seller.address && (
                            <p className="flex items-start gap-1 text-xs text-gray-500">
                              <MapPin size={13} className="mt-0.5 shrink-0" />

                              <span>{item.seller.address}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      status,
                    )}`}
                  >
                    {statusLabels[status]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================
          Delivery Actions
      ================================================== */}

      <div className="border-t bg-gray-50 px-5 py-4">
        {/* ==================================================
            AVAILABLE
        ================================================== */}

        {activeTab === "available" && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={actionLoading === acceptKey}
              onClick={() => onAccept(order._id)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === acceptKey ? (
                <>
                  <LoadingSpinner />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  Accept Delivery
                </>
              )}
            </button>
          </div>
        )}

        {/* ==================================================
            PENDING / MY ORDERS
        ================================================== */}

        {activeTab === "pending" &&
          orderStatus !== "outForDelivery" &&
          orderStatus !== "delivered" &&
          orderStatus !== "cancelled" && (
            <>
              {canStartDelivery ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={actionLoading === outForDeliveryKey}
                    onClick={() => onStatusUpdate(order._id, "outForDelivery")}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading === outForDeliveryKey ? (
                      <>
                        <LoadingSpinner />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Truck size={17} />
                        Out for Delivery
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                  <Clock3 size={16} />

                  {hasUnresolvedItems ? (
                    <span>Waiting for seller confirmation</span>
                  ) : !hasDeliverableItems ? (
                    <span>No available items to deliver</span>
                  ) : (
                    <span>Delivery cannot start yet</span>
                  )}
                </div>
              )}
            </>
          )}

        {/* ==================================================
            OUT FOR DELIVERY
        ================================================== */}

        {activeTab === "pending" && orderStatus === "outForDelivery" && (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading === deliveredKey}
              onClick={() => onStatusUpdate(order._id, "delivered")}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === deliveredKey ? (
                <>
                  <LoadingSpinner />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  Delivered
                </>
              )}
            </button>

            <button
              type="button"
              disabled={actionLoading === cancelledKey}
              onClick={() => onStatusUpdate(order._id, "cancelled")}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === cancelledKey ? (
                <>
                  <LoadingSpinner />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle size={17} />
                  Cancel
                </>
              )}
            </button>
          </div>
        )}

        {/* ==================================================
            COMPLETED
        ================================================== */}

        {activeTab === "completed" && (
          <div className="flex justify-end">
            {orderStatus === "delivered" ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 size={15} className="text-green-600" />
                Delivery completed
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <XCircle size={15} className="text-red-600" />
                Delivery cancelled
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ======================================================
// Pagination
// ======================================================

interface OrderPaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
}

function OrderPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}: OrderPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm">
      <button
        type="button"
        disabled={!hasPreviousPage}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={17} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <span className="text-sm text-gray-600">
        Page <span className="font-semibold text-gray-900">{currentPage}</span>{" "}
        of <span className="font-semibold text-gray-900">{totalPages}</span>
      </span>

      <button
        type="button"
        disabled={!hasNextPage}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={17} />
      </button>
    </div>
  );
}

// ======================================================
// Empty Orders
// ======================================================

function EmptyOrders({ tab }: { tab: OrderTab }) {
  const content = {
    available: {
      icon: Package,
      title: "No available orders",
      description: "There are currently no delivery orders available.",
    },

    pending: {
      icon: Clock3,
      title: "No pending deliveries",
      description: "You don't have any pending deliveries right now.",
    },

    completed: {
      icon: CheckCircle2,
      title: "No completed deliveries",
      description: "You haven't completed any deliveries yet.",
    },
  };

  const item = content[tab];

  const Icon = item.icon;

  return (
    <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Icon size={22} />
      </div>

      <h3 className="mt-3 font-semibold text-gray-900">{item.title}</h3>

      <p className="mt-1 text-sm text-gray-500">{item.description}</p>
    </div>
  );
}

// ======================================================
// Loading Spinner
// ======================================================

function LoadingSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

// ======================================================
// Format Date
// ======================================================

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ======================================================
// Format Address
// ======================================================

function formatAddress(address: unknown): string {
  if (!address) {
    return "Address not available";
  }

  if (typeof address === "string") {
    return address;
  }

  if (typeof address === "object") {
    const value = address as Record<string, unknown>;

    const parts = [
      value.address,
      value.street,
      value.area,
      value.city,
      value.state,
      value.pincode,
      value.zipCode,
    ].filter(
      (part): part is string =>
        typeof part === "string" && part.trim().length > 0,
    );

    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  return "Address not available";
}

// ======================================================
// Status Labels
// ======================================================

const statusLabels: Record<DeliveryOrderStatus, string> = {
  ordered: "Ordered",
  confirmed: "Confirmed",
  notAvailable: "Not Available",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ======================================================
// Status Classes
// ======================================================

function getStatusClasses(status: DeliveryOrderStatus) {
  switch (status) {
    case "ordered":
      return "bg-gray-100 text-gray-700";

    case "confirmed":
      return "bg-yellow-100 text-yellow-700";

    case "outForDelivery":
      return "bg-blue-100 text-blue-700";

    case "delivered":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "notAvailable":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}
