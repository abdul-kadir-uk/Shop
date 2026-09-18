// app/mobiles/cart/page.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import CartList from "@/components/mobiles/cart/CartList";

export default function MobileCartPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <ShoppingCart size={20} className="text-blue-600" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              My Cart
            </h1>

            <p className="text-xs text-gray-500 sm:text-sm">
              Review your mobile items
            </p>
          </div>
        </div>

        <Link
          href="/mobiles"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />

          <span className="hidden sm:inline">Continue Shopping</span>
          <span className="sm:hidden">Shop</span>
        </Link>
      </div>

      {/* Cart */}
      <CartList />
    </div>
  );
}
