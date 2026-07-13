"use client";

import Link from "next/link";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Approval Requests
        </h1>

        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Review pending seller and delivery partner account requests.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seller Requests */}
        <Link
          href="/owner/admin/requests/sellers"
          className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 border hover:border-green-600 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition">
                Seller Requests
              </h2>

              <p className="text-gray-500 mt-2 text-sm">
                View and manage all pending seller approval requests.
              </p>
            </div>

            <div className="text-4xl">🏪</div>
          </div>

          <div className="mt-6 inline-flex items-center text-green-600 font-medium">
            Open Requests
            <span className="ml-2">→</span>
          </div>
        </Link>

        {/* Delivery Requests */}
        <Link
          href="/owner/admin/requests/delivery-partners"
          className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 border hover:border-blue-600 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
                Delivery Partner Requests
              </h2>

              <p className="text-gray-500 mt-2 text-sm">
                View and manage all pending delivery partner approval requests.
              </p>
            </div>

            <div className="text-4xl">🚚</div>
          </div>

          <div className="mt-6 inline-flex items-center text-blue-600 font-medium">
            Open Requests
            <span className="ml-2">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
