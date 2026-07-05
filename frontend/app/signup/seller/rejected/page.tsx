"use client";

import Link from "next/link";

export default function DeliverySubmittedPage() {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <div>
        <h1
          className="text-3xl font-bold mb-4 
        text-center text-red-800"
        >
          Rejected
        </h1>

        <p className="text-gray-600 text-lg leading-relaxed mb-8 p-2">
          Thank you for your intrest but at these time we are not accepting new
          Seller Partner.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-yellow-800 font-medium">
            you can try again after few days.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition "
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
