// app/seller/medicine/profile/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import api from "@/lib/api";
import {
  ArrowLeft,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Pill,
  RefreshCw,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";

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

export default function MedicineProfilePage() {
  const router = useRouter();
  const { logoutUser } = useAuth();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/seller/profile");

      if (data.success && data.user) {
        setSeller(data.user);
      } else {
        setSeller(null);
      }
    } catch (error) {
      console.error("Failed to load medicine seller profile:", error);
      setSeller(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getProfile();
  }, [getProfile]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700 ring-green-200";

      case "pending":
        return "bg-yellow-100 text-yellow-700 ring-yellow-200";

      case "rejected":
        return "bg-red-100 text-red-700 ring-red-200";

      default:
        return "bg-gray-100 text-gray-700 ring-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return "Unknown";

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleLogout = () => {
    setLoggingOut(true);

    logoutUser();

    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
          <RefreshCw className="mx-auto animate-spin text-blue-600" size={30} />

          <p className="mt-4 text-lg text-gray-500">
            Loading medicine seller profile...
          </p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <UserRound size={28} />
          </div>

          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Unable to Load Profile
          </h2>

          <p className="mt-2 text-gray-500">
            We could not retrieve your medicine seller account information.
            Please try again.
          </p>

          <button
            type="button"
            onClick={() => void getProfile()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            <RefreshCw size={17} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Go Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Medicine Seller Profile
        </h1>

        <p className="mt-2 text-gray-500">
          View your medicine store and seller account information.
        </p>
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Banner */}
        <div className="bg-linear-to-r from-blue-700 to-indigo-600 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Pill size={34} />
            </div>

            <div className="min-w-0">
              <h2 className="wrap-break-word text-2xl font-bold sm:text-3xl">
                {seller.shopName || "Medicine Store"}
              </h2>

              <p className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                <Store size={16} />
                <span className="capitalize">
                  {seller.category || "Medicine"} Seller
                </span>
              </p>
            </div>

            <div className="sm:ml-auto">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
                  seller.approvalStatus?.toLowerCase() === "approved"
                    ? "bg-green-500/15 text-white ring-green-300/40"
                    : seller.approvalStatus?.toLowerCase() === "rejected"
                      ? "bg-red-500/15 text-white ring-red-300/40"
                      : "bg-white/15 text-white ring-white/30"
                }`}
              >
                <ShieldCheck size={16} />
                {formatStatus(seller.approvalStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Seller Details */}
        <div className="p-5 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Account Information
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Your registered seller details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Seller Name */}
            <div className="flex min-w-0 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <UserRound size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-gray-500">Seller Name</p>
                <h4 className="mt-1 wrap-break-word font-semibold text-gray-900">
                  {seller.name || "—"}
                </h4>
              </div>
            </div>

            {/* Email */}
            <div className="flex min-w-0 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Mail size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-gray-500">Email Address</p>
                <h4 className="mt-1 break-all font-semibold text-gray-900">
                  {seller.email || "—"}
                </h4>
              </div>
            </div>

            {/* Mobile */}
            <div className="flex min-w-0 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Phone size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-gray-500">Mobile Number</p>
                <h4 className="mt-1 wrap-break-word font-semibold text-gray-900">
                  {seller.mobile || "—"}
                </h4>
              </div>
            </div>

            {/* Category */}
            <div className="flex min-w-0 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Pill size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-gray-500">Seller Category</p>
                <h4 className="mt-1 wrap-break-word font-semibold capitalize text-gray-900">
                  {seller.category || "Medicine"}
                </h4>
              </div>
            </div>

            {/* Shop Name */}
            <div className="flex min-w-0 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Store size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-gray-500">Shop Name</p>
                <h4 className="mt-1 wrap-break-word font-semibold text-gray-900">
                  {seller.shopName || "—"}
                </h4>
              </div>
            </div>

            {/* Address */}
            <div className="flex min-w-0 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <MapPin size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-gray-500">Shop Address</p>
                <h4 className="mt-1 whitespace-pre-wrap wrap-break-word font-semibold text-gray-900">
                  {seller.address || "—"}
                </h4>
              </div>
            </div>

            {/* Approval Status */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <p className="text-sm text-gray-500">Approval Status</p>

              <span
                className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${getStatusColor(
                  seller.approvalStatus || "",
                )}`}
              >
                <ShieldCheck size={16} />
                {formatStatus(seller.approvalStatus)}
              </span>

              <p className="mt-3 text-sm text-gray-500">
                This status indicates the current approval state of your seller
                account.
              </p>
            </div>
          </div>

          {/* Logout */}
          <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Sign out of your account
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                You will be redirected to the login page.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <LogOut size={17} />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
