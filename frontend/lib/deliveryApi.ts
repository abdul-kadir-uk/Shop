import api from "@/lib/api";

// ======================================================
// Types
// ======================================================

export type DeliveryOrderStatus =
  | "ordered"
  | "confirmed"
  | "notAvailable"
  | "outForDelivery"
  | "delivered"
  | "cancelled";

// ======================================================
// Delivery User
// ======================================================

export interface DeliveryUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
}

// ======================================================
// Delivery Partner
// ======================================================

export interface DeliveryPartner {
  _id: string;
  userId: string;
  shopName?: string;
  category?: string;
  approvalStatus?: string;
}

// ======================================================
// Delivery Profile Response
// ======================================================

export interface DeliveryProfileResponse {
  success: boolean;
  user: DeliveryUser;
  deliveryPartner: DeliveryPartner;
}

// ======================================================
// Delivery Dashboard
// ======================================================

export interface DeliveryDashboardStats {
  availableDeliveries: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  totalAssigned: number;
}

export interface DeliveryDashboardResponse {
  success: boolean;
  dashboard: DeliveryDashboardStats;
  recentDeliveries: DeliveryOrder[];
}

// ======================================================
// Delivery Customer
// ======================================================

export interface DeliveryCustomer {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
}

// ======================================================
// Delivery Seller
// ======================================================

export interface DeliverySeller {
  _id: string;
  shopName: string;
  address: string;
}

// ======================================================
// Delivery Product
// ======================================================

export interface DeliveryProduct {
  _id: string;
  productName: string;
  slug: string;
}

// ======================================================
// Delivery Variant
// ======================================================

export interface DeliveryVariant {
  quantity?: number;
  unit?: string;
  label?: string;
}

// ======================================================
// Delivery Item
// ======================================================

export interface DeliveryItem {
  _id?: string;

  productName?: string;

  product?: DeliveryProduct;

  seller?: DeliverySeller;

  variantIndex?: number;

  quantity: number;

  // Snapshot price
  price: number;

  // Snapshot discounted price
  discountPrice?: number | null;

  // Backend-calculated subtotal
  subtotal: number;

  // Variant snapshot
  variant?: DeliveryVariant;

  // ----------------------------------------------------
  // ITEM / SELLER STATUS
  // ----------------------------------------------------
  //
  // This is independent from the parent orderStatus.
  //
  // Example:
  //
  // Parent:
  // orderStatus = "ordered"
  //
  // Item:
  // orderStatus = "confirmed"
  //
  // This is completely valid.
  // ----------------------------------------------------

  orderStatus: DeliveryOrderStatus;

  // Delivery partner assigned to this item.
  //
  // Since the delivery partner accepts the whole order,
  // all items normally receive the same partner ID.
  deliveryPartner?: string | null;

  acceptedAt?: string | null;

  deliveredAt?: string | null;
}

// ======================================================
// Delivery Order
// ======================================================

export interface DeliveryOrder {
  _id: string;

  orderNumber: string;

  // ----------------------------------------------------
  // PARENT / WHOLE ORDER STATUS
  // ----------------------------------------------------
  //
  // Delivery status is controlled here.
  //
  // ordered
  // outForDelivery
  // delivered
  // cancelled
  //
  // Seller item confirmation does NOT change this field.
  // ----------------------------------------------------

  orderStatus: DeliveryOrderStatus;

  customer: DeliveryCustomer;

  shippingAddress: unknown;

  deliveryContact?: unknown;

  items: DeliveryItem[];

  pricing?: unknown;

  paymentMethod?: string;

  paymentStatus?: string;

  createdAt: string;

  // ----------------------------------------------------
  // Delivery eligibility
  // ----------------------------------------------------
  //
  // true:
  // All seller items are resolved and at least one
  // item is confirmed/deliverable.
  //
  // false:
  // Delivery cannot start yet.
  //
  // IMPORTANT:
  // This does NOT control whether the order appears
  // in Available/My Orders.
  // ----------------------------------------------------

  canStartDelivery?: boolean;
}

// ======================================================
// Pagination
// ======================================================

export interface DeliveryPagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;

  limit: number;
}

// ======================================================
// Delivery Orders Response
// ======================================================

export interface DeliveryOrdersResponse {
  success: boolean;

  count: number;

  totalOrders?: number;

  totalPages?: number;

  page?: number;

  limit?: number;

  orders: DeliveryOrder[];

  status?: "pending" | "completed";

  pagination?: DeliveryPagination;
}

// ======================================================
// Get Delivery Dashboard
//
// GET /api/delivery/dashboard
// ======================================================

export const getDeliveryDashboard =
  async (): Promise<DeliveryDashboardResponse> => {
    const response = await api.get("/delivery/dashboard");

    return response.data;
  };

// ======================================================
// Get Delivery Profile
//
// GET /api/delivery/profile
// ======================================================

export const getDeliveryProfile =
  async (): Promise<DeliveryProfileResponse> => {
    const response = await api.get("/delivery/profile");

    return response.data;
  };

// ======================================================
// Daily Delivery Earnings
//
// GET /api/delivery/earnings/daily?page=1
//
// Returns maximum 5 days per request.
// ======================================================

export interface DailyDeliveryEarning {
  date: string;
  totalOrders: number;
  totalEarnings: number;
  paymentStatus: "pending" | "paid";
}

export interface DailyDeliveryEarningsPagination {
  page: number;
  limit: number;
  totalDays: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DailyDeliveryEarningsResponse {
  success: boolean;
  data: DailyDeliveryEarning[];
  pagination: DailyDeliveryEarningsPagination;
}

export const getMyDailyDeliveryEarnings = async (
  page: number = 1,
): Promise<DailyDeliveryEarningsResponse> => {
  const response = await api.get("/delivery/earnings/daily", {
    params: {
      page,
    },
  });

  return response.data;
};

// ======================================================
// Get Available Delivery Orders
//
// GET /api/delivery/orders
//
// Pagination:
//
// GET /api/delivery/orders?page=1
//
// IMPORTANT
// ======================================================
//
// The backend should return WHOLE orders that are available
// to delivery partners.
//
// Seller item status must NOT be used to hide the order.
//
// Therefore both of these must be visible:
//
// Parent order:
// ordered
//
// Item status:
// ordered
//
// OR:
//
// Parent order:
// ordered
//
// Item status:
// confirmed
//
// Seller confirmation must NOT remove the order from
// Available Orders.
//
// ======================================================

export const getAvailableDeliveryOrders = async (
  page: number = 1,
): Promise<DeliveryOrdersResponse> => {
  const response = await api.get("/delivery/orders", {
    params: {
      page,
    },
  });

  return response.data;
};

// ======================================================
// Accept Delivery Order
//
// PATCH
// /api/delivery/orders/:orderId/accept
//
// IMPORTANT
// ======================================================
//
// The delivery partner accepts the WHOLE order.
//
// There is NO itemIndex.
//
// Seller confirmation is NOT required.
//
// An order can be accepted while:
//
// item.orderStatus === "ordered"
//
// OR:
//
// item.orderStatus === "confirmed"
//
// ======================================================

export const acceptDeliveryOrder = async (orderId: string) => {
  const response = await api.patch(`/delivery/orders/${orderId}/accept`);

  return response.data;
};

// ======================================================
// Get My Delivery Orders
//
// Pending:
//
// GET /api/delivery/my-orders?status=pending&page=1
//
// Completed:
//
// GET /api/delivery/my-orders?status=completed&page=1
//
// IMPORTANT
// ======================================================
//
// Pending orders accepted by this delivery partner must
// remain visible regardless of seller item status.
//
// Example:
//
// Parent order:
// ordered
//
// Item:
// ordered
//
// OR:
//
// Parent order:
// ordered
//
// Item:
// confirmed
//
// Both remain in My Orders.
//
// The backend identifies ownership using
// items.deliveryPartner.
// ======================================================

export const getMyDeliveryOrders = async (
  status: "pending" | "completed" = "pending",
  page: number = 1,
): Promise<DeliveryOrdersResponse> => {
  const response = await api.get("/delivery/my-orders", {
    params: {
      status,
      page,
    },
  });

  return response.data;
};

// ======================================================
// Update Delivery Order Status
//
// PATCH
// /api/delivery/orders/:orderId/status
//
// Body:
//
// {
//   status: "outForDelivery"
// }
//
// OR:
//
// {
//   status: "delivered"
// }
//
// OR:
//
// {
//   status: "cancelled"
// }
//
// IMPORTANT
// ======================================================
//
// This updates the WHOLE ORDER.
//
// There is NO itemIndex.
//
// ======================================================

export const updateDeliveryOrderStatus = async (
  orderId: string,
  status: "outForDelivery" | "delivered" | "cancelled",
) => {
  const response = await api.patch(`/delivery/orders/${orderId}/status`, {
    status,
  });

  return response.data;
};
