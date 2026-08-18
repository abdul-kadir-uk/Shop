// app/seller/grocery/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import GrocerySidebar from "@/components/seller/GrocerySidebar";
import GroceryHeader from "@/components/seller/GroceryHeader";
import { useAuth } from "@/context/authContext";

export default function GroceryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { loading, isLoggedIn } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Wait until auth state is checked
    if (loading) return;

    // User is not logged in → send to login
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, router]);

  // While authentication is being checked,
  // don't render the protected page.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Checking authentication...</div>
      </div>
    );
  }

  // Prevent protected UI from flashing before redirect
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`
            fixed lg:static
            inset-y-0 left-0
            z-50
            w-72
            transform
            bg-white
            transition-transform duration-300
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          <GrocerySidebar closeSidebar={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 lg:ml-0">
          <GroceryHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
