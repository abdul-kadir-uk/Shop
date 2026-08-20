// app/seller/grocery/page.tsx
"use client";

import { useEffect, useState } from "react";

import api from "@/lib/api";

type DashboardData = {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
};

type DashboardResponse = {
  success: boolean;
  dashboard: DashboardData;
};

export default function GroceryDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<DashboardResponse>("/seller/dashboard");

        if (response.data.success) {
          setDashboard(response.data.dashboard);
        } else {
          setError("Failed to load dashboard.");
        }
      } catch (error) {
        setError("Failed to load dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ------------------------------------------------------
  // Loading State
  // ------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Grocery Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow p-4 sm:p-6">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />

              <div className="h-9 w-20 bg-gray-200 rounded mt-3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // Error State
  // ------------------------------------------------------

  if (error || !dashboard) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>

        <div className="bg-white rounded-xl shadow border p-8 text-center">
          <p className="text-red-600">{error || "Unable to load dashboard."}</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Grocery Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <p className="text-gray-500">Total Products</p>

          <h3 className="text-3xl font-bold mt-2">{dashboard.totalProducts}</h3>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <p className="text-gray-500">Orders</p>

          <h3 className="text-3xl font-bold mt-2">{dashboard.totalOrders}</h3>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <p className="text-gray-500">Revenue</p>

          <h3 className="text-3xl font-bold mt-2">
            ₹{dashboard.revenue.toLocaleString("en-IN")}
          </h3>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <p className="text-gray-500">Pending Orders</p>

          <h3 className="text-3xl font-bold mt-2">{dashboard.pendingOrders}</h3>
        </div>
      </div>
    </div>
  );
}
