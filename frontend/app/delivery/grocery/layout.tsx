"use client";

import { useState } from "react";
import DeliverySidebar from "@/components/groceries/delivery/DeliverySidebar";
import DeliveryHeader from "@/components/groceries/delivery/DeliveryHeder";

export default function DeliveryGroceryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <DeliverySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <DeliveryHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
