// lib/cartApi.ts

import axios from "axios";
import { getToken } from "@/lib/auth";

const cartApi = axios.create({
  baseURL: "http://localhost:5000/api/cart",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every cart request
cartApi.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ======================================================
// Add Product To Cart
// POST /api/cart/add
// ======================================================

export const addToCart = async (
  productId: string,
  quantity: number = 1,
  variantIndex: number = -1,
) => {
  const { data } = await cartApi.post("/add", {
    productId,
    quantity,
    variantIndex,
  });

  return data;
};

// ======================================================
// Get Cart
// GET /api/cart
// ======================================================

export const getCart = async () => {
  const { data } = await cartApi.get("/");

  return data;
};

// ======================================================
// Get Cart Count
// GET /api/cart/count
// ======================================================

export const getCartCount = async () => {
  const { data } = await cartApi.get("/count");

  return data;
};

// ======================================================
// Update Cart Quantity
// PATCH /api/cart/update
// ======================================================

export const updateCartQuantity = async (
  productId: string,
  quantity: number,
  variantIndex: number = -1,
) => {
  const { data } = await cartApi.patch("/update", {
    productId,
    quantity,
    variantIndex,
  });

  return data;
};

// ======================================================
// Remove Cart Item
// DELETE /api/cart/remove/:productId
// ======================================================

export const removeCartItem = async (
  productId: string,
  variantIndex: number = -1,
) => {
  const { data } = await cartApi.delete(`/remove/${productId}`, {
    params: {
      variantIndex,
    },
  });

  return data;
};

// ======================================================
// Clear Cart
// DELETE /api/cart/clear
// ======================================================

export const clearCart = async () => {
  const { data } = await cartApi.delete("/clear");

  return data;
};

export default cartApi;
