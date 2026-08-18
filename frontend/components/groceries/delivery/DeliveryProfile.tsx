// components/groceries/delivery/DeliveryProfile.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { User, Phone, MapPin, Mail, LogOut } from "lucide-react";

import { getDeliveryProfile } from "@/lib/deliveryApi";
import { useAuth } from "@/context/authContext";

interface ProfileData {
  name: string;
  email: string;
  mobile: string;
  address: string;
}

export default function DeliveryProfile() {
  const router = useRouter();

  const { loading: authLoading, isLoggedIn } = useAuth();

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================================
  // Fetch Profile
  // ======================================================

  const fetchProfile = async () => {
    // Never fetch profile when user is logged out
    if (!isLoggedIn) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getDeliveryProfile();

      if (!data.success) {
        throw new Error("Failed to fetch profile.");
      }

      setProfile({
        name: data.user?.name || "",
        email: data.user?.email || "",
        mobile: data.user?.mobile || "",
        address: data.user?.address || "",
      });
    } catch (error: any) {
      console.error("Delivery Profile Error:", error);

      // If the API says the user is unauthorized,
      // send them to login instead of showing an Axios error.
      if (error?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError("Failed to load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Authentication / Initial Load
  // ======================================================

  useEffect(() => {
    // Wait until authentication check is finished
    if (authLoading) {
      return;
    }

    // User is not logged in
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // User is authenticated, now fetch profile
    fetchProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn]);

  // ======================================================
  // Logout
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    window.location.href = "/login";
  };

  // ======================================================
  // Authentication Loading
  // ======================================================

  if (authLoading) {
    return (
      <div className="flex min-h-75 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      </div>
    );
  }

  // ======================================================
  // Logged Out
  // ======================================================

  if (!isLoggedIn) {
    return null;
  }

  // ======================================================
  // Loading
  // ======================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

          <p className="mt-1 text-sm text-gray-500">
            View your delivery partner information.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
          </div>
        </div>
      </div>
    );
  }

  // ======================================================
  // Error
  // ======================================================

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

          <p className="mt-1 text-sm text-gray-500">
            View your delivery partner information.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                router.replace("/login");
                return;
              }

              fetchProfile();
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // Profile UI
  // ======================================================

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        <p className="mt-1 text-sm text-gray-500">
          View your delivery partner information.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border bg-white shadow-sm">
        {/* Profile Header */}
        <div className="border-b px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
              <User size={27} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                {profile.name || "Delivery Partner"}
              </h2>

              <p className="text-sm text-gray-500">Delivery Partner</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="divide-y">
          {/* Name */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <User size={18} />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Name</p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {profile.name || "Not available"}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Mail size={18} />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Email</p>

              <p className="mt-1 break-all text-sm font-medium text-gray-900">
                {profile.email || "Not available"}
              </p>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Phone size={18} />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Mobile</p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {profile.mobile || "Not available"}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <MapPin size={18} />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Address</p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {profile.address || "Not available"}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t p-5">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 sm:w-auto"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
