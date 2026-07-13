"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminApi from "@/lib/adminApi";

export default function SellerRequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchSeller = async () => {
    try {
      setLoading(true);

      const { data } = await adminApi.get(`/admin/requests/sellers/${id}`);

      setSeller(data.seller);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load seller request.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);

      await adminApi.patch(`/admin/requests/sellers/${id}/approve`);

      alert("Seller approved successfully.");

      router.push("/owner/admin/requests/sellers");
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this seller request?",
    );

    if (!confirmReject) return;

    try {
      setRejecting(true);

      await adminApi.patch(`/admin/requests/sellers/${id}/reject`);

      alert("Seller request rejected.");

      router.push("/owner/admin/requests/sellers");
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setRejecting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSeller();
    }
  }, [id]);

  if (loading) {
    return <div className="p-6 text-center">Loading seller request...</div>;
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
          Seller Request Details
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Review the seller request before approving or rejecting it.
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
            <p className="text-sm text-gray-500">Approval Status</p>

            <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
              Pending
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Requested Date</p>
            <p className="font-semibold text-gray-800 mt-1">{joinedDate}</p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-semibold text-gray-800 mt-1">{seller.address}</p>
          </div>
        </div>

        {/* Action Buttons */}

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4">
          <Link
            href="/owner/admin/requests/sellers"
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition text-center"
          >
            Back
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approving ? "Approving..." : "Approve Seller"}
            </button>

            <button
              onClick={handleReject}
              disabled={rejecting}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rejecting ? "Rejecting..." : "Reject Seller"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
