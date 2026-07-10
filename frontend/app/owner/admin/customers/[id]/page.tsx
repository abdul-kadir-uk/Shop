"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminApi from "@/lib/adminApi";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomer = async () => {
    try {
      setLoading(true);

      const { data } = await adminApi.get(`/admin/customer/${id}`);

      setCustomer(data.customer);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    try {
      setUpdating(true);

      if (customer.isBlocked) {
        await adminApi.patch(`/admin/customer/${id}/unblock`);
      } else {
        await adminApi.patch(`/admin/customer/${id}/block`);
      }

      setCustomer((prev: any) => ({
        ...prev,
        isBlocked: !prev.isBlocked,
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      await adminApi.delete(`/admin/customer/${id}`);

      alert("Customer deleted successfully.");

      router.push("/owner/admin/customers");
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  if (loading) {
    return <div className="p-6 text-center">Loading customer...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  const joinedDate = new Date(customer.joined).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Customer Details
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          View customer information and manage account status.
        </p>
      </div>

      {/* Details Card */}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-semibold text-gray-800 mt-1">{customer.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-semibold text-gray-800 mt-1">{customer.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Mobile Number</p>
            <p className="font-semibold text-gray-800 mt-1">
              {customer.mobile}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-semibold capitalize text-gray-800 mt-1">
              {customer.role}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-semibold text-gray-800 mt-1">
              {customer.address}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Joined Date</p>
            <p className="font-semibold text-gray-800 mt-1">{joinedDate}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Verification Status</p>

            <span
              className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
                customer.isVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {customer.isVerified ? "Verified" : "Not Verified"}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Account Status</p>

            <span
              className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
                customer.isBlocked
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {customer.isBlocked ? "Blocked" : "Active"}
            </span>
          </div>
        </div>

        {/* Buttons */}

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4">
          <Link
            href="/owner/admin/customers"
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition text-center"
          >
            Back
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBlockToggle}
              disabled={updating}
              className={`px-5 py-2 rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                customer.isBlocked
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {updating
                ? "Updating..."
                : customer.isBlocked
                  ? "Unblock Customer"
                  : "Block Customer"}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
