"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";

export default function DeliveryPartnersPage() {
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchDeliveryPartners = async (searchValue = "") => {
    try {
      setLoading(true);

      const { data } = await adminApi.get("/admin/delivery-partners", {
        params: {
          search: searchValue,
        },
      });

      setDeliveryPartners(data.deliveryPartners);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load delivery partners.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (id: string, isBlocked: boolean) => {
    try {
      setUpdatingId(id);

      if (isBlocked) {
        await adminApi.put(`/admin/delivery-partners/${id}/unblock`);
      } else {
        await adminApi.put(`/admin/delivery-partners/${id}/block`);
      }

      setDeliveryPartners((prev) =>
        prev.map((deliveryPartner) =>
          deliveryPartner._id === id
            ? {
                ...deliveryPartner,
                isBlocked: !isBlocked,
              }
            : deliveryPartner,
        ),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeliveryPartners(search);
    }, 2000);

    return () => clearTimeout(timer);
  }, [search]);

  if (loading) {
    return <div className="p-6 text-center">Loading delivery partners...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Delivery Partners
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Manage all approved delivery partners.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or mobile..."
          className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-600"
        />
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
                  Joined
                </th>

                <th className="text-left px-2 md:px-3 py-2 whitespace-nowrap">
                  Status
                </th>

                <th className="text-center px-2 md:px-3 py-2 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {deliveryPartners.map((deliveryPartner) => (
                <tr
                  key={deliveryPartner._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-2 md:px-3 py-2 font-medium whitespace-nowrap">
                    {deliveryPartner.name}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {deliveryPartner.email}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {deliveryPartner.mobile}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    {new Date(deliveryPartner.joined).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </td>

                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        deliveryPartner.isBlocked
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {deliveryPartner.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>

                  <td className="px-2 md:px-3 py-2">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Link
                        href={`/owner/admin/delivery/${deliveryPartner._id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition text-center"
                      >
                        View
                      </Link>

                      <button
                        disabled={updatingId === deliveryPartner._id}
                        onClick={() =>
                          handleBlockToggle(
                            deliveryPartner._id,
                            deliveryPartner.isBlocked,
                          )
                        }
                        className={`px-3 py-1 rounded-lg text-sm text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          deliveryPartner.isBlocked
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {updatingId === deliveryPartner._id
                          ? "Updating..."
                          : deliveryPartner.isBlocked
                            ? "Unblock"
                            : "Block"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {deliveryPartners.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No approved delivery partners found.
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
