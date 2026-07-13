"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import adminApi from "@/lib/adminApi";

export default function DeliveryPartnerRequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [deliveryPartner, setDeliveryPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchDeliveryPartner = async () => {
    try {
      setLoading(true);

      const { data } = await adminApi.get(
        `/admin/requests/delivery-partners/${id}`,
      );

      setDeliveryPartner(data.deliveryPartner);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to load delivery partner request.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);

      await adminApi.patch(`/admin/requests/delivery-partners/${id}/approve`);

      alert("Delivery partner approved successfully.");

      router.push("/owner/admin/requests/delivery-partners");
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this delivery partner request?",
    );

    if (!confirmReject) return;

    try {
      setRejecting(true);

      await adminApi.patch(`/admin/requests/delivery-partners/${id}/reject`);

      alert("Delivery partner request rejected.");

      router.push("/owner/admin/requests/delivery-partners");
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setRejecting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDeliveryPartner();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-center">Loading delivery partner request...</div>
    );
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
          Delivery Partner Request Details
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Review the delivery partner request before approving or rejecting it.
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
            <p className="text-sm text-gray-500">Aadhaar Number</p>
            <p className="font-semibold text-gray-800 mt-1">
              {deliveryPartner.aadhaarNumber}
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

          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-semibold text-gray-800 mt-1">
              {deliveryPartner.address}
            </p>
          </div>

          <div>
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

        {/* Action Buttons */}

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4">
          <Link
            href="/owner/admin/requests/delivery-partners"
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
              {approving ? "Approving..." : "Approve Delivery Partner"}
            </button>

            <button
              onClick={handleReject}
              disabled={rejecting}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rejecting ? "Rejecting..." : "Reject Delivery Partner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
