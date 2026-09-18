// lib/mobileCheckoutApi.ts
import axios from "axios";
import { getToken } from "@/lib/auth";

const mobileCheckoutApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/mobile-checkout`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every mobile checkout request
mobileCheckoutApi.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ======================================================
// Get Mobile Checkout Summary
// POST /api/mobile-checkout/summary
// ======================================================

export const getMobileCheckoutSummary = async ({
  type,
  productId,
  quantity = 1,
  cityId,
  color,
}: {
  type: "buyNow" | "cart";
  productId?: string;
  quantity?: number;
  cityId: string;
  color?: string;
}) => {
  const { data } = await mobileCheckoutApi.post("/summary", {
    type,
    productId,
    quantity,
    cityId,
    color,
  });

  return data;
};

export default mobileCheckoutApi;
