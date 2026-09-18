// lib/mobileCartApi.ts

import axios from "axios";
import { getToken } from "@/lib/auth";

const mobileCartApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/mobile-cart`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every mobile cart request
mobileCartApi.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ======================================================
// Add Mobile Product To Cart
// POST /api/mobile-cart
// ======================================================

export const addToMobileCart = async (
  productId: string,
  quantity = 1,
  color = "",
) => {
  const { data } = await mobileCartApi.post("/", {
    productId,
    quantity,
    color,
  });

  return data;
};

// ======================================================
// Get Mobile Cart
// GET /api/mobile-cart
// ======================================================

export const getMobileCart = async () => {
  const { data } = await mobileCartApi.get("/");

  return data;
};

// ======================================================
// Get Mobile Cart Count
// GET /api/mobile-cart/count
// ======================================================

export const getMobileCartCount = async () => {
  const { data } = await mobileCartApi.get("/count");

  return data;
};

// ======================================================
// Update Mobile Cart Quantity
// PUT /api/mobile-cart
// ======================================================

export const updateMobileCartQuantity = async (
  productId: string,
  quantity: number,
  color = "",
) => {
  const { data } = await mobileCartApi.put("/", {
    productId,
    quantity,
    color,
  });

  return data;
};

// ======================================================
// Remove Mobile Cart Item
// DELETE /api/mobile-cart/remove/:productId
// ======================================================

export const removeMobileCartItem = async (productId: string, color = "") => {
  const { data } = await mobileCartApi.delete(`/remove/${productId}`, {
    data: {
      color,
    },
  });

  return data;
};

// ======================================================
// Clear Mobile Cart
// DELETE /api/mobile-cart/clear
// ======================================================

export const clearMobileCart = async () => {
  const { data } = await mobileCartApi.delete("/clear");

  return data;
};

export default mobileCartApi;
