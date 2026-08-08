"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function SellerDashboard() {
  const router = useRouter();

  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get("/seller/dashboard");

      setSeller(data.seller);
    } catch (error: any) {
      console.error(error);

      // Backend tells frontend where to go
      if (error.response?.data?.redirect) {
        router.replace(error.response.data.redirect);
        return;
      }

      // Unauthorized or other error
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Seller Dashboard</h1>

      <div className="mt-6 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          Welcome, {seller?.name || "Seller"}
        </h2>

        <p className="mt-2">
          Shop Name: <strong>{seller?.shopName}</strong>
        </p>

        <p>
          Category: <strong>{seller?.category}</strong>
        </p>

        <p>
          Approval Status: <strong>{seller?.approvalStatus}</strong>
        </p>
      </div>
    </div>
  );
}
