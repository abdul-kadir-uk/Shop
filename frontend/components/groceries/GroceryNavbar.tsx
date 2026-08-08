"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Menu, X, Store, Home, Package } from "lucide-react";

export default function GroceryNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-sm sm:text-xl font-bold text-green-600"
          >
            <Store className="h-7 w-7" />
            <span>Aliauf Grocery</span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden items-center gap-8 md:flex">
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
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative rounded-full p-2 transition hover:bg-gray-100"
            >
              <ShoppingCart className="h-4 w-4 text-gray-700" />

              {/* Cart Count */}
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                0
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 transition hover:bg-gray-100 md:hidden"
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
          <div className="border-t bg-white md:hidden">
            <nav className="flex flex-col p-4">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                <Home size={18} />
                Home
              </Link>

              <Link
                href="/groceries"
                className="mt-2 flex items-center gap-3 rounded-lg bg-green-50 px-3 py-3 font-medium text-green-600"
                onClick={() => setMenuOpen(false)}
              >
                <Package size={18} />
                Groceries
              </Link>

              <Link
                href="/cart"
                className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                <ShoppingCart size={18} />
                Cart
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
