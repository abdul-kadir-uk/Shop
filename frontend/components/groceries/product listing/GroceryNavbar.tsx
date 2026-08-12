// components/groceries/GroceryNavbar.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Menu,
  X,
  Home,
  Package,
  ClipboardList,
} from "lucide-react";

import { getCartCount } from "@/lib/cartApi";
import { isLoggedIn } from "@/lib/auth";

export default function GroceryNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    if (!isLoggedIn()) {
      setCartCount(0);
      return;
    }

    try {
      const data = await getCartCount();

      if (data.success) {
        setCartCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();

    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  return (
    <header className="border-b bg-white">
      {/* Main Navbar */}
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-3 sm:px-4 lg:px-8">
        {/* Logo */}
        <Link
          href="/groceries"
          className="text-lg font-bold text-green-600 sm:text-xl"
        >
          Aliauf Grocery
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-8 lg:flex">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 transition hover:text-green-600"
          >
            <Home size={18} />
            Home
          </Link>

          <Link
            href="/groceries"
            className="flex items-center gap-2 font-medium text-green-600"
          >
            <Package size={18} />
            Groceries
          </Link>

          {/* My Orders */}
          <Link
            href="/groceries/orders"
            className="flex items-center gap-2 text-gray-700 transition hover:text-green-600"
          >
            <ClipboardList size={18} />
            My Orders
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* Cart */}
          <Link
            href="/groceries/cart"
            className="relative rounded-full p-2 transition hover:bg-gray-100"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5 text-gray-700" />

            {/* Cart Count */}
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 transition hover:bg-gray-100 lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t bg-white lg:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col p-3 sm:p-4">
            {/* Home */}
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 transition hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <Home size={18} />
              Home
            </Link>

            {/* Groceries */}
            <Link
              href="/groceries"
              className="mt-1 flex items-center gap-3 rounded-lg bg-green-50 px-3 py-3 font-medium text-green-600"
              onClick={() => setMenuOpen(false)}
            >
              <Package size={18} />
              Groceries
            </Link>

            {/* My Orders */}
            <Link
              href="/groceries/orders"
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 transition hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <ClipboardList size={18} />
              My Orders
            </Link>

            {/* Cart */}
            <Link
              href="/groceries/cart"
              className="mt-1 flex items-center justify-between rounded-lg px-3 py-3 text-gray-700 transition hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <span className="flex items-center gap-3">
                <ShoppingCart size={18} />
                Cart
              </span>

              {cartCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
