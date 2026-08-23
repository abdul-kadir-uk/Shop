// app/signup/delivery/verify-otp/VerifyOtpContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

export default function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mobile = searchParams.get("mobile") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // ---------------------------------
  // Resend Timer
  // ---------------------------------

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  // ---------------------------------
  // Verify OTP
  // ---------------------------------

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!mobile) {
      setError("Mobile number is missing. Please start signup again.");
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/delivery/signup/verify-otp", {
        mobile,
        otp,
      });

      if (data.success) {
        router.push("/signup/delivery/under-review");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to verify OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------
  // Resend OTP
  // ---------------------------------

  const handleResendOtp = async () => {
    setError("");

    if (!mobile) {
      setError("Mobile number is missing. Please start signup again.");
      return;
    }

    if (resendTimer > 0) {
      return;
    }

    try {
      setResendLoading(true);

      // We cannot resend using only the mobile number because
      // the complete pending signup data is intentionally required
      // by the signup endpoint.

      setError(
        "Please return to the signup page and submit the form again to request a new OTP.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">
          Verify Mobile Number
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Enter the 6-digit OTP sent to
        </p>

        <p className="text-center font-semibold mb-6">{mobile}</p>

        {error && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);

              setOtp(value);
              setError("");
            }}
            placeholder="Enter 6-digit OTP"
            className="w-full rounded-xl border p-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="mt-6 text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-gray-500">
              You can request another OTP in{" "}
              <span className="font-semibold">{resendTimer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="font-medium text-green-600 hover:text-green-700 disabled:text-gray-400"
            >
              {resendLoading ? "Please wait..." : "Resend OTP"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
