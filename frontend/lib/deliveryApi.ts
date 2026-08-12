import api from "@/lib/api";

// ======================================================
// Types
// ======================================================

export interface DeliveryUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
}

export interface DeliveryPartner {
  _id: string;
  userId: string;
  shopName?: string;
  category?: string;
  approvalStatus?: string;
}

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

  product?: DeliveryProduct;

  seller?: DeliverySeller;

  quantity: number;

  // Price stored in the order snapshot
  price: number;

  // Optional discounted price stored in the order snapshot
  discountPrice?: number | null;

  // Backend-calculated item subtotal
  subtotal: number;

  // Variant snapshot stored inside the order
  variant?: DeliveryVariant;

  orderStatus:
    | "ordered"
    | "confirmed"
    | "notAvailable"
    | "outForDelivery"
    | "delivered"
    | "cancelled";

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

  customer: DeliveryCustomer;

  shippingAddress: unknown;

  deliveryContact?: unknown;

  items: DeliveryItem[];

  pricing?: unknown;

  createdAt: string;
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

  orders: DeliveryOrder[];

  status?: "pending" | "completed";

  pagination?: DeliveryPagination;
}

// ======================================================
// Get Delivery Dashboard
// GET /api/delivery/dashboard
// ======================================================

export const getDeliveryDashboard =
  async (): Promise<DeliveryDashboardResponse> => {
    const response = await api.get("/delivery/dashboard");

    return response.data;
  };

// ======================================================
// Get Delivery Profile
// GET /api/delivery/profile
// ======================================================

export const getDeliveryProfile =
  async (): Promise<DeliveryProfileResponse> => {
    const response = await api.get("/delivery/profile");

    return response.data;
  };

// ======================================================
// Get Available Delivery Orders
//
// GET /api/delivery/orders
//
// Pagination:
// GET /api/delivery/orders?page=1
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
// Accept Delivery Order Item
//
// PATCH
// /api/delivery/orders/:orderId/items/:itemIndex/accept
// ======================================================

export const acceptDeliveryOrder = async (
  orderId: string,
  itemIndex: number,
) => {
  const response = await api.patch(
    `/delivery/orders/${orderId}/items/${itemIndex}/accept`,
  );

  return response.data;
};

// ======================================================
// Get My Delivery Orders
//
// Pending:
// GET /api/delivery/my-orders?status=pending&page=1
//
// Completed:
// GET /api/delivery/my-orders?status=completed&page=1
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
// /api/delivery/orders/:orderId/items/:itemIndex/status
// ======================================================

export const updateDeliveryOrderStatus = async (
  orderId: string,
  itemIndex: number,
  status: "outForDelivery" | "delivered" | "cancelled",
) => {
  const response = await api.patch(
    `/delivery/orders/${orderId}/items/${itemIndex}/status`,
    {
      status,
    },
  );

  return response.data;
};
