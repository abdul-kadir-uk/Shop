// lib/groceryOrderApi.ts

import axios from "axios";
import { getToken } from "./auth";

const groceryOrderApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// Add JWT Token
// ======================================================

groceryOrderApi.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ======================================================
// Get Checkout Summary
// POST /api/checkout/summary
// ======================================================

export const getCheckoutSummary = async (payload: {
  type: "cart" | "buyNow";
  productId?: string;
  variantIndex?: number;
  quantity?: number;
}) => {
  const { data } = await groceryOrderApi.post("/checkout/summary", payload);

  return data;
};

// ======================================================
// Place Order
// POST /api/orders
// ======================================================

export const placeOrder = async (payload: {
  type: "cart" | "buyNow";
  productId?: string;
  variantIndex?: number;
  quantity?: number;
  cityId: string;
  address: string;
  alternateMobile?: string;
  paymentMethod: "COD";
}) => {
  const { data } = await groceryOrderApi.post("/orders", payload);

  return data;
};

// ======================================================
// Get Single Order
// GET /api/orders/:orderId
// ======================================================

export const getSingleOrder = async (orderId: string) => {
  const { data } = await groceryOrderApi.get(`/orders/${orderId}`);

  return data;
};

// ======================================================
// Get My Orders
// GET /api/orders/my-orders
// ======================================================

export const getMyOrders = async () => {
  const { data } = await groceryOrderApi.get("/orders/my-orders");

  return data;
};

// ======================================================
// Cancel Whole Order
// PATCH /api/orders/:orderId/cancel
// ======================================================

export const cancelOrder = async (orderId: string) => {
  const { data } = await groceryOrderApi.patch(`/orders/${orderId}/cancel`);

  return data;
};

export default groceryOrderApi;
