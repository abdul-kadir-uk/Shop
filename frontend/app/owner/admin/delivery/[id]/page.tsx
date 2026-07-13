// admin/delivery/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminApi from "@/lib/adminApi";

export default function DeliveryPartnerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [deliveryPartner, setDeliveryPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDeliveryPartner = async () => {
    try {
      setLoading(true);

      const { data } = await adminApi.get(`/admin/delivery-partners/${id}`);

      setDeliveryPartner(data.deliveryPartner);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load delivery partner.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    try {
      setUpdating(true);

      if (deliveryPartner.isBlocked) {
        await adminApi.put(`/admin/delivery-partners/${id}/unblock`);
      } else {
        await adminApi.put(`/admin/delivery-partners/${id}/block`);
      }

      setDeliveryPartner((prev: any) => ({
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
      "Are you sure you want to delete this delivery partner?",
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      await adminApi.delete(`/admin/delivery-partners/${id}`);

      alert("Delivery partner deleted successfully.");

      router.push("/owner/admin/delivery");
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDeliveryPartner();
    }
  }, [id]);

  if (loading) {
    return <div className="p-6 text-center">Loading delivery partner...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  const joinedDate = new Date(deliveryPartner.joined).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <div className="space-y-6">
      {/* Heading */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Delivery Partner Details
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          View delivery partner information and manage account status.
        </p>
      </div>

      {/* Details Card */}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-semibold text-gray-800 mt-1">
              {deliveryPartner.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-semibold text-gray-800 mt-1">
              {deliveryPartner.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Mobile Number</p>
            <p className="font-semibold text-gray-800 mt-1">
              {deliveryPartner.mobile}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-semibold capitalize text-gray-800 mt-1">
              {deliveryPartner.role}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Aadhaar Number</p>
            <p className="font-semibold text-gray-800 mt-1">
              {deliveryPartner.aadhaarNumber}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Approval Status</p>

            <span
              className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
                deliveryPartner.approvalStatus === "approved"
                  ? "bg-green-100 text-green-700"
                  : deliveryPartner.approvalStatus === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {deliveryPartner.approvalStatus.charAt(0).toUpperCase() +
                deliveryPartner.approvalStatus.slice(1)}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Verification Status</p>

            <span
              className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
                deliveryPartner.isVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {deliveryPartner.isVerified ? "Verified" : "Not Verified"}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Account Status</p>

            <span
              className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
                deliveryPartner.isBlocked
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {deliveryPartner.isBlocked ? "Blocked" : "Active"}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Joined Date</p>
            <p className="font-semibold text-gray-800 mt-1">{joinedDate}</p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-semibold text-gray-800 mt-1">
              {deliveryPartner.address}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Aadhaar Document</p>

            <a
              href={deliveryPartner.aadhaarDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              View Aadhaar Document
            </a>
          </div>
        </div>

        {/* Buttons */}

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4">
          <Link
            href="/owner/admin/delivery"
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition text-center"
          >
            Back
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBlockToggle}
              disabled={updating}
              className={`px-5 py-2 rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                deliveryPartner.isBlocked
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {updating
                ? "Updating..."
                : deliveryPartner.isBlocked
                  ? "Unblock Delivery Partner"
                  : "Block Delivery Partner"}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete Delivery Partner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
