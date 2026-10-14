// app/seller/medicine/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import MedicineSidebar from "@/components/seller/medicine/MedicineSidebar";
import MedicineHeader from "@/components/seller/medicine/MedicineHeader";
import { useAuth } from "@/context/authContext";

export default function MedicineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { loading, isLoggedIn } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Wait until authentication state is checked.
    if (loading) return;

    // Redirect unauthenticated users to login.
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, router]);

  // Wait until authentication is checked.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Checking authentication...</div>
      </div>
    );
  }

  // Prevent protected content from flashing before redirect.
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
          <MedicineSidebar closeSidebar={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 lg:ml-0">
          <MedicineHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
