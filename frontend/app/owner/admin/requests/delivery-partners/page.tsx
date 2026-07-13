"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";

export default function DeliveryPartnerRequestsPage() {
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchDeliveryRequests = async () => {
    try {
      setLoading(true);

      const { data } = await adminApi.get("/admin/requests/delivery-partners");

      setDeliveryPartners(data.deliveryPartners);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to load delivery partner requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryRequests();
  }, []);

  const approveDeliveryPartner = async (id: string) => {
    try {
      setUpdatingId(id);

      await adminApi.patch(`/admin/requests/delivery-partners/${id}/approve`);

      setDeliveryPartners((prev) =>
        prev.filter((partner) => partner._id !== id),
      );
    } catch (err: any) {
      alert(
        err.response?.data?.message || "Failed to approve delivery partner.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const rejectDeliveryPartner = async (id: string) => {
    try {
      setUpdatingId(id);

      await adminApi.patch(`/admin/requests/delivery-partners/${id}/reject`);

      setDeliveryPartners((prev) =>
        prev.filter((partner) => partner._id !== id),
      );
    } catch (err: any) {
      alert(
        err.response?.data?.message || "Failed to reject delivery partner.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading delivery partner requests...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Delivery Partner Requests
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Review all pending delivery partner approval requests.
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
                  Email
                </th>

                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Mobile
                </th>

                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Aadhaar Number
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
              {deliveryPartners.map((partner) => (
                <tr key={partner._id} className="border-t hover:bg-gray-50">
                  <td className="px-2 md:px-3 py-2 font-medium whitespace-nowrap">
                    {partner.name}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {partner.userId?.email || "-"}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {partner.mobile}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {partner.aadhaarNumber}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {new Date(partner.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-2 md:px-3 py-2">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Link
                        href={`/owner/admin/requests/delivery-partners/${partner._id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition text-center"
                      >
                        View
                      </Link>

                      <button
                        disabled={updatingId === partner._id}
                        onClick={() => approveDeliveryPartner(partner._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingId === partner._id ? "Updating..." : "Approve"}
                      </button>

                      <button
                        disabled={updatingId === partner._id}
                        onClick={() => rejectDeliveryPartner(partner._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingId === partner._id ? "Updating..." : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {deliveryPartners.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No pending delivery partner requests found.
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
