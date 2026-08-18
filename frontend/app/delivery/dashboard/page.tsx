// app/deliveryPartner/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/authContext";

export default function deliveryPartnerDashboard() {
  const router = useRouter();
  const { logoutUser, isLoggedIn } = useAuth();

  const [deliveryPartner, setDeliveryPartner] = useState<any>(null);
  const [deliveryUser, setDeliveryUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get("/delivery/profile");

      setDeliveryPartner(data.user);
      setDeliveryUser(data.deliveryPartner);
    } catch (error: any) {
      console.error(error);

      // Backend tells frontend where to go
      if (error.response?.data?.redirect) {
        router.replace(error.response.data.redirect);
        return;
      }

      // Unauthorized or other error
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleDashboard = () => {
    // if (!deliveryPartner?.category) return;

    const category = "grocery";

    // Grocery deliveryPartner
    if (category === "grocery" || category === "groceries") {
      router.push("/delivery/grocery");
      return;
    }

    // Mobile repair deliveryPartner
    if (
      category === "mobile-repair" ||
      category === "mobile repair" ||
      category === "mobile_repair"
    ) {
      router.push("/deliveryPartner/mobile-repair");
      return;
    }

    alert("No dashboard is available for your deliveryPartner category yet.");
  };

  const handleLogout = () => {
    setLoggingOut(true);

    logoutUser();

    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />

          <p className="mt-4 text-sm text-gray-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!deliveryPartner) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-green-600">
              deliveryPartner Panel
            </p>

            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              deliveryPartner Dashboard
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="overflow-hidden rounded-2xl bg-linear-to-r from-green-600 to-emerald-500 p-6 text-white shadow-lg sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-green-100">Welcome back</p>

            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              {deliveryPartner.name || "deliveryPartner"}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-green-50 sm:text-base">
              Manage your orders.
            </p>
          </div>
        </div>

        {/* deliveryPartner Information */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Main deliveryPartner Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  deliveryPartner Information
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Your registered deliveryPartner account details
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                {(deliveryPartner.name || "S").charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <InfoItem
                label="Name"
                value={deliveryPartner.name || "Not available"}
              />

              <InfoItem
                label="Mobile"
                value={deliveryPartner.mobile || "Not available"}
              />

              <InfoItem
                label="Email"
                value={deliveryPartner.email || "Not available"}
              />

              <InfoItem
                label="Approval Status"
                value={formatStatus(deliveryUser.approvalStatus)}
              />
            </div>

            {deliveryUser.address && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Address
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {deliveryUser.address}
                </p>
              </div>
            )}
          </div>

          {/* Account Status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Account Status</h3>

            <div className="mt-5 rounded-xl bg-green-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <span className="text-lg text-green-700">✓</span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-green-800">
                    {formatStatus(deliveryUser.approvalStatus)}
                  </p>

                  <p className="mt-1 text-xs text-green-700">
                    Your deliveryPartner account is active.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Action */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">
                deliveryPartner Workspace
              </p>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Open the dashboard designed specifically for your delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Dashboard
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Bottom Logout */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   Helper Components
========================================================= */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 wrap-break-word text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   Helpers
========================================================= */

function formatCategory(category: string | undefined) {
  if (!category) return "Not available";

  return category
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatus(status: string | undefined) {
  if (!status) return "Not available";

  return status
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
