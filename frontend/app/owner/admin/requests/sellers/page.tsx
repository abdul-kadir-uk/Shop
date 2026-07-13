"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";

export default function SellerRequestsPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSellerRequests = async () => {
    try {
      setLoading(true);

      const { data } = await adminApi.get("/admin/requests/sellers");

      setSellers(data.sellers);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load seller requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerRequests();
  }, []);

  const approveSeller = async (id: string) => {
    try {
      setUpdatingId(id);

      await adminApi.patch(`/admin/requests/sellers/${id}/approve`);

      setSellers((prev) => prev.filter((seller) => seller._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve seller.");
    } finally {
      setUpdatingId(null);
    }
  };

  const rejectSeller = async (id: string) => {
    try {
      setUpdatingId(id);

      await adminApi.patch(`/admin/requests/sellers/${id}/reject`);

      setSellers((prev) => prev.filter((seller) => seller._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject seller.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading seller requests...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Seller Requests
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Review all pending seller approval requests.
        </p>
      </div>

      {/* Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Name
                </th>

                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Shop
                </th>

                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Category
                </th>

                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Email
                </th>

                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Mobile
                </th>

                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Requested
                </th>

                <th className="text-center px-2 md:px-3 py-2 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {sellers.map((seller) => (
                <tr key={seller._id} className="border-t hover:bg-gray-50">
                  <td className="px-2 md:px-3 py-2 font-medium whitespace-nowrap">
                    {seller.name}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {seller.shopName}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap capitalize">
                    {seller.category}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {seller.userId?.email || "-"}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {seller.mobile}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {new Date(seller.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-2 md:px-3 py-2">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Link
                        href={`/owner/admin/requests/sellers/${seller._id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition text-center"
                      >
                        View
                      </Link>

                      <button
                        disabled={updatingId === seller._id}
                        onClick={() => approveSeller(seller._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingId === seller._id ? "Updating..." : "Approve"}
                      </button>

                      <button
                        disabled={updatingId === seller._id}
                        onClick={() => rejectSeller(seller._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingId === seller._id ? "Updating..." : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {sellers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No pending seller requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
