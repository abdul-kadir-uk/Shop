"use client";

import Link from "next/link";

export default function DeliverySubmittedPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-lg p-10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-100">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Application Submitted Successfully
        </h1>

        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Thank you for applying as a Delivery Partner.
          <br />
          Your application has been received and is currently under review.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-yellow-800 font-medium">
            Please wait while our team verifies your details and documents.
          </p>
          <p className=" text-md mt-2">
            You will check the status after few minutes by logging into your
            account.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
