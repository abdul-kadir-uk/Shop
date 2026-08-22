"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/authContext";

export default function SellerDashboard() {
  const router = useRouter();
  const { logoutUser, isLoggedIn } = useAuth();

  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // =========================================================
  // Telegram State
  // =========================================================

  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramStatusLoading, setTelegramStatusLoading] = useState(true);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramConnectionCount, setTelegramConnectionCount] = useState(0);

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
      const { data } = await api.get("/seller/profile");

      setSeller(data.user);
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
      setTelegramConnectionCount(data?.connectionCount || 0);
    } catch (error) {
      console.error("Telegram Status Error:", error);

      // Telegram status failure should NOT affect
      // the seller dashboard.
      setTelegramConnected(false);
      setTelegramConnectionCount(0);
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

      // Telegram connection happens outside the website.
      // Refresh status after a short delay so that when the
      // seller returns, the dashboard can show the new status.
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
    if (!seller?.category) return;

    const category = seller.category.toLowerCase().trim();

    // Grocery seller
    if (category === "grocery" || category === "groceries") {
      router.push("/seller/grocery");
      return;
    }

    // Mobile repair seller
    if (
      category === "mobile-repair" ||
      category === "mobile repair" ||
      category === "mobile_repair"
    ) {
      router.push("/seller/mobile-repair");
      return;
    }

    alert("No dashboard is available for your seller category yet.");
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

  if (!seller) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-green-600">Seller Panel</p>

            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Seller Dashboard
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
              {seller.name || "Seller"}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-green-50 sm:text-base">
              Manage your shop, products, orders and seller activities from your
              category dashboard.
            </p>
          </div>
        </div>

        {/* Seller Information */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Main Seller Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Seller Information
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Your registered seller account details
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                {(seller.name || "S").charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <InfoItem label="Name" value={seller.name || "Not available"} />

              <InfoItem
                label="Shop Name"
                value={seller.shopName || "Not available"}
              />

              <InfoItem
                label="Category"
                value={formatCategory(seller.category)}
              />

              <InfoItem
                label="Mobile"
                value={seller.mobile || "Not available"}
              />

              <InfoItem label="Email" value={seller.email || "Not available"} />

              <InfoItem
                label="GSTIN"
                value={seller.gstinNumber || "Not available"}
              />

              <InfoItem
                label="City"
                value={
                  typeof seller.city === "object"
                    ? seller.city?.name || "Not available"
                    : seller.city || "Not available"
                }
              />

              <InfoItem
                label="Approval Status"
                value={formatStatus(seller.approvalStatus)}
              />
            </div>

            {seller.address && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Address
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {seller.address}
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
                    {formatStatus(seller.approvalStatus)}
                  </p>

                  <p className="mt-1 text-xs text-green-700">
                    Your seller account is active.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Seller Category
              </p>

              <p className="mt-2 text-lg font-bold text-gray-900">
                {formatCategory(seller.category)}
              </p>
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
                      Your Telegram notifications are connected.
                      {telegramConnectionCount > 0 && (
                        <>
                          {" "}
                          {telegramConnectionCount}{" "}
                          {telegramConnectionCount === 1
                            ? "Telegram account is"
                            : "Telegram accounts are"}{" "}
                          connected to this seller account.
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      Connect Telegram to receive important seller notifications
                      directly on Telegram. You can connect your Telegram
                      account or your shop workers' Telegram accounts.
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
                        ? "Connect Another"
                        : "Connect Telegram"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Connected accounts information */}
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
                        Telegram notifications are active
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-700">
                        All connected Telegram accounts can receive
                        notifications for this seller account.
                      </p>

                      <p className="mt-2 text-xs font-medium text-green-800">
                        You can connect additional worker Telegram accounts
                        using the button above.
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
                Seller Workspace
              </p>

              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                Go to your category dashboard
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Open the dashboard designed specifically for your seller
                category.
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
