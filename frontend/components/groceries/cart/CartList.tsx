// components/cart/CartList.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearCart,
  getCart,
  removeCartItem,
  updateCartQuantity,
} from "@/lib/cartApi";
import { isLoggedIn } from "@/lib/auth";
import CartItem from "./CartItem";

type CartItemData = {
  productId: string;
  productName: string;
  slug: string;
  brand: string;
  image: string | null;
  seller: any;
  variantIndex: number;
  variantLabel: string | null;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
  subtotal: number;
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

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      if (!isLoggedIn()) {
        router.replace("/login");
        return;
      }

      const data = await getCart();

      if (data.success) {
        setCart(data.cart);
      } else {
        setError(data.message || "Failed to load cart.");
      }
    } catch (error: any) {
      console.error("Get Cart Error:", error);

      setError(error?.response?.data?.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ======================================================
  // Update Quantity
  // ======================================================

  const handleUpdateQuantity = async (
    productId: string,
    quantity: number,
    variantIndex: number,
  ) => {
    const key = `${productId}-${variantIndex}`;

    try {
      setUpdatingItem(key);
      setError("");

      const data = await updateCartQuantity(productId, quantity, variantIndex);

      if (data.success) {
        await fetchCart();

        window.dispatchEvent(new Event("cart-updated"));
      } else {
        setError(data.message || "Failed to update cart.");
      }
    } catch (error: any) {
      console.error("Update Cart Error:", error);

      setError(error?.response?.data?.message || "Failed to update cart.");
    } finally {
      setUpdatingItem(null);
    }
  };

  // ======================================================
  // Remove Item
  // ======================================================

  const handleRemove = async (productId: string, variantIndex: number) => {
    const key = `${productId}-${variantIndex}`;

    try {
      setUpdatingItem(key);
      setError("");

      const data = await removeCartItem(productId, variantIndex);

      if (data.success) {
        await fetchCart();

        window.dispatchEvent(new Event("cart-updated"));
      } else {
        setError(data.message || "Failed to remove item.");
      }
    } catch (error: any) {
      console.error("Remove Cart Item Error:", error);

      setError(error?.response?.data?.message || "Failed to remove item.");
    } finally {
      setUpdatingItem(null);
    }
  };

  // ======================================================
  // Clear Cart
  // ======================================================

  const handleClearCart = async () => {
    try {
      setClearing(true);
      setError("");

      const data = await clearCart();

      if (data.success) {
        await fetchCart();

        window.dispatchEvent(new Event("cart-updated"));
      } else {
        setError(data.message || "Failed to clear cart.");
      }
    } catch (error: any) {
      console.error("Clear Cart Error:", error);

      setError(error?.response?.data?.message || "Failed to clear cart.");
    } finally {
      setClearing(false);
    }
  };

  // ======================================================
  // Proceed To Checkout
  // ======================================================

  const handleCheckout = () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    if (!cart || cart.items.length === 0) {
      return;
    }

    router.push("/groceries/checkout?type=cart");
  };

  // ======================================================
  // Loading
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  // ======================================================
  // Error
  // ======================================================

  if (error && !cart) {
    return (
      <div className="rounded-xl border bg-white p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>

        <button
          type="button"
          onClick={fetchCart}
          className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ======================================================
  // Empty Cart
  // ======================================================

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Your cart is empty
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Add some grocery products to your cart and they will appear here.
        </p>

        <a
          href="/groceries"
          className="mt-5 inline-flex rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      {/* ==================================================
          Cart Items
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
            const key = `${item.productId}-${item.variantIndex}`;

            return (
              <CartItem
                key={key}
                item={item}
                updating={updatingItem === key}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            );
          })}
        </div>
      </section>

      {/* ==================================================
          Summary
      ================================================== */}

      <aside className="h-fit rounded-xl border bg-white p-4 lg:sticky lg:top-5">
        <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>

            <span className="font-medium">₹{cart.subtotal}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Discount</span>

            <span className="font-medium text-green-600">
              -₹{cart.discount}
            </span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>

              <span className="text-xl font-bold text-green-600">
                ₹{cart.total}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout */}
        <button
          type="button"
          onClick={handleCheckout}
          className="mt-5 h-11 w-full rounded-lg bg-green-600 text-sm font-semibold text-white transition hover:bg-green-700"
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
