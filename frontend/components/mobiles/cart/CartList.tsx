// components/mobiles/cart/CartList.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearMobileCart,
  getMobileCart,
  removeMobileCartItem,
  updateMobileCartQuantity,
} from "@/lib/mobileCartApi";

import { isLoggedIn } from "@/lib/auth";

import CartItem from "./CartItem";

type CartItemData = {
  productId: string;
  productName: string;
  slug: string;
  brand: string;
  image: string | null;
  seller: any;
  quantity: number;

  // Color
  color?: string | null;
  colorPrice?: number | null;

  // Variant
  variantGroupId?: string | null;
  variantName?: string | null;
  ram?: string | null;
  storage?: string | null;

  // Price
  originalPrice: number;
  sellingPrice: number;
  discountPrice?: number | null;
  subtotal: number;
  discount?: number;

  isAvailable: boolean;
};

type CartData = {
  items: CartItemData[];

  subtotal: number;
  discount: number;
  total: number;

  totalItems: number;
  totalQuantity: number;
};

export default function CartList() {
  const router = useRouter();

  const [cart, setCart] = useState<CartData | null>(null);

  const [loading, setLoading] = useState(true);

  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  const [clearing, setClearing] = useState(false);

  const [error, setError] = useState("");

  // ======================================================
  // FETCH CART
  // ======================================================

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      if (!isLoggedIn()) {
        router.replace("/login");
        return;
      }

      const data = await getMobileCart();

      if (data.success) {
        setCart(data.cart);
      } else {
        setError(data.message || "Failed to load cart.");
      }
    } catch (error: any) {
      console.error("Get Mobile Cart Error:", error);

      setError(error?.response?.data?.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ======================================================
  // CREATE UNIQUE ITEM KEY
  //
  // Same product + different color = different item
  // ======================================================

  const getItemKey = (productId: string, color = "") => {
    return `${productId}-${color.trim().toLowerCase()}`;
  };

  // ======================================================
  // UPDATE QUANTITY
  // ======================================================

  const handleUpdateQuantity = async (
    productId: string,
    quantity: number,
    color: string,
  ) => {
    const itemKey = getItemKey(productId, color);

    try {
      setUpdatingItem(itemKey);
      setError("");

      const data = await updateMobileCartQuantity(productId, quantity, color);

      if (data.success) {
        await fetchCart();

        window.dispatchEvent(new Event("mobile-cart-updated"));
      } else {
        setError(data.message || "Failed to update cart.");
      }
    } catch (error: any) {
      console.error("Update Mobile Cart Error:", error);

      setError(error?.response?.data?.message || "Failed to update cart.");
    } finally {
      setUpdatingItem(null);
    }
  };

  // ======================================================
  // REMOVE ITEM
  // ======================================================

  const handleRemove = async (productId: string, color: string) => {
    const itemKey = getItemKey(productId, color);

    try {
      setUpdatingItem(itemKey);
      setError("");

      const data = await removeMobileCartItem(productId, color);

      if (data.success) {
        await fetchCart();

        window.dispatchEvent(new Event("mobile-cart-updated"));
      } else {
        setError(data.message || "Failed to remove item.");
      }
    } catch (error: any) {
      console.error("Remove Mobile Cart Item Error:", error);

      setError(error?.response?.data?.message || "Failed to remove item.");
    } finally {
      setUpdatingItem(null);
    }
  };

  // ======================================================
  // CLEAR CART
  // ======================================================

  const handleClearCart = async () => {
    try {
      setClearing(true);
      setError("");

      const data = await clearMobileCart();

      if (data.success) {
        await fetchCart();

        window.dispatchEvent(new Event("mobile-cart-updated"));
      } else {
        setError(data.message || "Failed to clear cart.");
      }
    } catch (error: any) {
      console.error("Clear Mobile Cart Error:", error);

      setError(error?.response?.data?.message || "Failed to clear cart.");
    } finally {
      setClearing(false);
    }
  };

  // ======================================================
  // PROCEED TO CHECKOUT
  // ======================================================

  const handleCheckout = () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    if (!cart || cart.items.length === 0) {
      return;
    }

    router.push("/mobiles/checkout?type=cart");
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error && !cart) {
    return (
      <div className="rounded-xl border bg-white p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>

        <button
          type="button"
          onClick={fetchCart}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ======================================================
  // EMPTY CART
  // ======================================================

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Your cart is empty
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Add some mobile products to your cart and they will appear here.
        </p>

        <a
          href="/mobiles"
          className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  // ======================================================
  // PRICE CALCULATIONS
  // ======================================================

  const originalSubtotal = cart.items.reduce(
    (total, item) =>
      total + Number(item.originalPrice || 0) * Number(item.quantity || 0),
    0,
  );

  const productTotal = cart.items.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0,
  );

  const totalDiscount = cart.items.reduce(
    (total, item) =>
      total +
      Math.max(
        Number(item.originalPrice || 0) * Number(item.quantity || 0) -
          Number(item.subtotal || 0),
        0,
      ),
    0,
  );

  const finalTotal = productTotal;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      {/* ==================================================
          CART ITEMS
      ================================================== */}

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Cart Items</h1>

            <p className="text-xs text-gray-500">
              {cart.totalQuantity} item
              {cart.totalQuantity !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            disabled={clearing}
            onClick={handleClearCart}
            className="text-sm font-medium text-red-500 transition hover:text-red-600 disabled:opacity-50"
          >
            {clearing ? "Clearing..." : "Clear Cart"}
          </button>
        </div>

        {error && (
          <div className="border-b bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          {cart.items.map((item) => {
            const itemKey = getItemKey(item.productId, item.color || "");

            return (
              <CartItem
                key={itemKey}
                item={item}
                updating={updatingItem === itemKey}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            );
          })}
        </div>
      </section>

      {/* ==================================================
          ORDER SUMMARY
      ================================================== */}

      <aside className="h-fit rounded-xl border bg-white p-4 lg:sticky lg:top-5">
        <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

        <div className="mt-4 space-y-3 text-sm">
          {/* Original Product Price */}
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>

            <span className="font-medium text-gray-900">
              ₹{originalSubtotal.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Discount */}
          <div className="flex justify-between">
            <span className="text-gray-500">Discount</span>

            <span className="font-medium text-green-600">
              -₹
              {totalDiscount.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Actual Product Total */}
          <div className="flex justify-between">
            <span className="text-gray-500">Product Total</span>

            <span className="font-medium text-gray-900">
              ₹{productTotal.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Final Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>

              <span className="text-xl font-bold text-blue-600">
                ₹{finalTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckout}
          className="mt-5 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Proceed to Checkout
        </button>

        <p className="mt-2 text-center text-xs text-gray-400">
          Review your address and order details before placing your order.
        </p>
      </aside>
    </div>
  );
}
