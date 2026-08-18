"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

interface SellerProfile {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  shopName: string;
  address: string;
  category: string;
  approvalStatus: string;
}

export default function GroceryProfilePage() {
  const router = useRouter();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { logoutUser } = useAuth();

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data } = await api.get("seller/profile");

      if (data.success) {
        setSeller(data.user);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleLogout = () => {
    setLoggingOut(true);

    logoutUser();

    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="bg-white rounded-xl shadow border p-10 text-center">
          <p className="text-gray-500 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-4xl">
        <div className="bg-white rounded-xl shadow border p-10 text-center">
          <p className="text-red-500 text-lg">Unable to load profile.</p>

          <button
            onClick={getProfile}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>

        <p className="text-gray-500 mt-2">
          View your seller account information.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {/* Banner */}
        <div className="bg-green-600 text-white p-6">
          <h2 className="text-2xl font-bold">{seller.shopName}</h2>

          <p className="mt-1 opacity-90 capitalize">{seller.category} Seller</p>
        </div>

        {/* Details */}
        <div className="p-5 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-500">Seller Name</p>

              <h3 className="text-lg font-semibold mt-1">{seller.name}</h3>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>

              <h3 className="text-lg font-semibold mt-1 break-all">
                {seller.email}
              </h3>
            </div>

            <div>
              <p className="text-sm text-gray-500">Mobile Number</p>

              <h3 className="text-lg font-semibold mt-1">{seller.mobile}</h3>
            </div>

            <div>
              <p className="text-sm text-gray-500">Category</p>

              <h3 className="text-lg font-semibold mt-1 capitalize">
                {seller.category}
              </h3>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Shop Address</p>

              <h3 className="text-lg font-semibold mt-1">{seller.address}</h3>
            </div>

            <div>
              <p className="text-sm text-gray-500">Approval Status</p>

              <span
                className={`inline-flex mt-2 px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  seller.approvalStatus,
                )}`}
              >
                {seller.approvalStatus.charAt(0).toUpperCase() +
                  seller.approvalStatus.slice(1)}
              </span>
            </div>
          </div>

          {/* Logout */}
          <div className="mt-10 border-t pt-6">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
