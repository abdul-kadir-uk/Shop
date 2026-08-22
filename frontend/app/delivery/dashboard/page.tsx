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

  // =========================================================
  // Telegram State
  // =========================================================

  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramStatusLoading, setTelegramStatusLoading] = useState(true);
  const [telegramConnected, setTelegramConnected] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    fetchDashboard();
    fetchTelegramStatus();
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

  // =========================================================
  // Telegram Status
  // =========================================================

  const fetchTelegramStatus = async () => {
    try {
      setTelegramStatusLoading(true);

      const { data } = await api.get("/telegram/status");

      setTelegramConnected(Boolean(data?.connected));
    } catch (error) {
      console.error("Telegram Status Error:", error);

      // Telegram status failure should not affect
      // the delivery dashboard.
      setTelegramConnected(false);
    } finally {
      setTelegramStatusLoading(false);
    }
  };

  // =========================================================
  // Connect Telegram
  // =========================================================

  const handleConnectTelegram = async () => {
    try {
      setTelegramLoading(true);

      const { data } = await api.get("/telegram/connect");

      if (!data?.telegramUrl) {
        alert("Telegram connection link could not be generated.");
        return;
      }

      // Open Telegram in a new tab/window.
      window.open(data.telegramUrl, "_blank", "noopener,noreferrer");

      // Give the webhook a little time to process /start.
      // Then refresh the connection status.
      setTimeout(() => {
        fetchTelegramStatus();
      }, 3000);
    } catch (error: any) {
      console.error("Telegram Connection Error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to connect Telegram. Please try again.",
      );
    } finally {
      setTelegramLoading(false);
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

        {/* =====================================================
            Telegram Connection
        ===================================================== */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Telegram Information */}
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                    telegramConnected ? "bg-green-100" : "bg-sky-100"
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {telegramConnected ? "✓" : "✈"}
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-green-600">
                      Telegram Notifications
                    </p>

                    {!telegramStatusLoading && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          telegramConnected
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {telegramConnected ? "Connected" : "Not Connected"}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                    Connect Telegram
                  </h3>

                  {telegramStatusLoading ? (
                    <p className="mt-2 text-sm text-gray-500">
                      Checking Telegram connection...
                    </p>
                  ) : telegramConnected ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      Your Telegram account is successfully connected. You will
                      receive important delivery notifications here.
                    </p>
                  ) : (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      Connect Telegram to receive important delivery
                      notifications directly on Telegram.
                    </p>
                  )}
                </div>
              </div>

              {/* Telegram Button */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleConnectTelegram}
                  disabled={telegramLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                >
                  {telegramLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">✈</span>
                      {telegramConnected
                        ? "Connect Telegram Again"
                        : "Connect Telegram"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Connected information */}
            {!telegramStatusLoading && telegramConnected && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="rounded-xl bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <span className="text-sm font-bold text-green-700">
                        ✓
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Telegram successfully connected
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-700">
                        You will receive your delivery notifications on your
                        connected Telegram account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
