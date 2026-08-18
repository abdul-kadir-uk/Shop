"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useAuth } from "@/context/authContext";

export default function AuthBanner() {
  const { loading, isLoggedIn, user } = useAuth();

  return (
    <section className="bg-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Welcome to Aliauf Store</h2>

          <p className="text-sm text-green-100">
            Sign up or login to place orders.
          </p>
        </div>

        {loading ? (
          <div className="h-10" />
        ) : isLoggedIn ? (
          <Link
            href="/profile"
            className="flex items-center gap-3 bg-white text-green-700 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="font-medium">Hi, {user?.name || "User"} 👋</span>

            <User size={22} />
          </Link>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-5 py-2 rounded-lg bg-white text-green-600 font-medium hover:bg-gray-100 transition"
            >
              Login
            </Link>

            <Link
              href="/signup/customer"
              className="px-5 py-2 rounded-lg border border-white hover:bg-green-700 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
