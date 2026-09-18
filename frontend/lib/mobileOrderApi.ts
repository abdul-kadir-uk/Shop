// lib/mobileOrderApi.ts
import axios from "axios";
import { getToken } from "@/lib/auth";

const mobileOrderApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/mobile-orders`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every mobile order request
mobileOrderApi.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ======================================================
// Create Mobile Order
// POST /api/mobile-orders
// ======================================================

export const createMobileOrder = async ({
  type,
  productId,
  quantity = 1,
  color,
  cityId,
  address,
  primaryMobile,
  alternateMobile = "",
  paymentMethod = "COD",
}: {
  type: "buyNow" | "cart";
  productId?: string;
  quantity?: number;
  color?: string;
  cityId: string;
  address: string;
  primaryMobile: string;
  alternateMobile?: string;
  paymentMethod?: "COD";
}) => {
  const { data } = await mobileOrderApi.post("/", {
    type,
    productId,
    quantity,
    color,
    cityId,
    address,
    primaryMobile,
    alternateMobile,
    paymentMethod,
  });

  return data;
};

// ======================================================
// Get My Mobile Orders
// GET /api/mobile-orders
// ======================================================

export const getMyMobileOrders = async () => {
  const { data } = await mobileOrderApi.get("/");

  return data;
};

// ======================================================
// Get Single Mobile Order
// GET /api/mobile-orders/:id
// ======================================================

export const getSingleMobileOrder = async (orderId: string) => {
  const { data } = await mobileOrderApi.get(`/${orderId}`);

  return data;
};

// ======================================================
// Cancel Mobile Order
// PATCH /api/mobile-orders/:id/cancel
// ======================================================

export const cancelMobileOrder = async (orderId: string) => {
  const { data } = await mobileOrderApi.patch(`/${orderId}/cancel`);

  return data;
};

export default mobileOrderApi;
