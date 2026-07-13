// admin/sellers/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminApi from "@/lib/adminApi";

export default function SellerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSeller = async () => {
    try {
      setLoading(true);

      const { data } = await adminApi.get(`/admin/sellers/${id}`);

      setSeller(data.seller);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load seller.");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    try {
      setUpdating(true);

      if (seller.isBlocked) {
        await adminApi.put(`/admin/sellers/${id}/unblock`);
      } else {
        await adminApi.put(`/admin/sellers/${id}/block`);
      }

      setSeller((prev: any) => ({
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
      "Are you sure you want to delete this seller?",
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      await adminApi.delete(`/admin/sellers/${id}`);

      alert("Seller deleted successfully.");

      router.push("/owner/admin/sellers");
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSeller();
    }
  }, [id]);

  if (loading) {
    return <div className="p-6 text-center">Loading seller...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  const joinedDate = new Date(seller.joined).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Seller Details
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          View seller information and manage account status.
        </p>
      </div>

      {/* Details Card */}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Owner Name</p>
            <p className="font-semibold text-gray-800 mt-1">{seller.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Shop Name</p>
            <p className="font-semibold text-gray-800 mt-1">
              {seller.shopName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-semibold text-gray-800 mt-1">{seller.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Mobile Number</p>
            <p className="font-semibold text-gray-800 mt-1">{seller.mobile}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-semibold capitalize text-gray-800 mt-1">
              {seller.category.replace("-", " ")}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-semibold capitalize text-gray-800 mt-1">
              {seller.role}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Approval Status</p>

            <span
              className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
                seller.approvalStatus === "approved"
                  ? "bg-green-100 text-green-700"
                  : seller.approvalStatus === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {seller.approvalStatus.charAt(0).toUpperCase() +
                seller.approvalStatus.slice(1)}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Verification Status</p>

            <span
              className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
                seller.isVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {seller.isVerified ? "Verified" : "Not Verified"}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Account Status</p>

            <span
              className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
                seller.isBlocked
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {seller.isBlocked ? "Blocked" : "Active"}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Joined Date</p>
            <p className="font-semibold text-gray-800 mt-1">{joinedDate}</p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-semibold text-gray-800 mt-1">{seller.address}</p>
          </div>
        </div>

        {/* Buttons */}

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4">
          <Link
            href="/owner/admin/sellers"
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition text-center"
          >
            Back
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBlockToggle}
              disabled={updating}
              className={`px-5 py-2 rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                seller.isBlocked
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {updating
                ? "Updating..."
                : seller.isBlocked
                  ? "Unblock Seller"
                  : "Block Seller"}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete Seller"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
