// admin/customers/page.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchCustomers = async (searchValue = "") => {
    try {
      setLoading(true);

      const { data } = await adminApi.get("/admin/customers", {
        params: {
          search: searchValue,
        },
      });

      setCustomers(data.customers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (id: string, isBlocked: boolean) => {
    try {
      setUpdatingId(id);

      if (isBlocked) {
        await adminApi.patch(`/admin/customer/${id}/unblock`);
      } else {
        await adminApi.patch(`/admin/customer/${id}/block`);
      }

      // Update only the changed customer in state
      setCustomers((prev) =>
        prev.map((customer) =>
          customer._id === id
            ? {
                ...customer,
                isBlocked: !isBlocked,
              }
            : customer,
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
      fetchCustomers(search);
    }, 2000);

    return () => clearTimeout(timer);
  }, [search]);

  if (loading) {
    return <div className="p-6 text-center">Loading customers...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Customers
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Manage all registered customers.
        </p>
      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or mobile..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Name
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Email
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Mobile
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Joined
                </th>

                <th className="text-left px-4 md:px-6 py-4 whitespace-nowrap">
                  Status
                </th>

                <th className="text-center px-4 md:px-6 py-4 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                    {customer.name}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {customer.email}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {customer.mobile}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {new Date(customer.joined).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        customer.isBlocked
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {customer.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>

                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Link
                        href={`/owner/admin/customers/${customer._id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition text-center"
                      >
                        View
                      </Link>

                      <button
                        disabled={updatingId === customer._id}
                        onClick={() =>
                          handleBlockToggle(customer._id, customer.isBlocked)
                        }
                        className={`px-4 py-2 rounded-lg text-sm text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          customer.isBlocked
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {updatingId === customer._id
                          ? "Updating..."
                          : customer.isBlocked
                            ? "Unblock"
                            : "Block"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
