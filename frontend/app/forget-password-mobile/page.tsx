// app/forget-password-mobile/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ForgotPasswordMobilePage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ---------------------------------
  // Send OTP
  // ---------------------------------

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const normalizedMobile = mobile.trim();

    // ---------------------------------
    // Mobile validation
    // ---------------------------------

    if (!/^[0-9]{10}$/.test(normalizedMobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/password-reset/send-otp", {
        mobile: normalizedMobile,
      });

      setOtpSent(true);
      setMessage(data.message || "OTP sent successfully.");
    } catch (error: any) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to connect to the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------
  // Verify OTP
  // ---------------------------------

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const normalizedMobile = mobile.trim();
    const normalizedOtp = otp.trim();

    // ---------------------------------
    // OTP validation
    // ---------------------------------

    if (!/^[0-9]{6}$/.test(normalizedOtp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/password-reset/verify-otp", {
        mobile: normalizedMobile,
        otp: normalizedOtp,
      });

      // ---------------------------------
      // Save existing reset token
      // ---------------------------------

      localStorage.setItem("resetToken", data.resetToken);

      // ---------------------------------
      // Redirect to existing reset page
      // ---------------------------------

      router.push("/reset-password");
    } catch (error: any) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to connect to the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------
  // Back to password recovery
  // ---------------------------------

  const handleBack = () => {
    router.push("/forget-password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}

        <h1 className="text-3xl font-bold text-center mb-2">Reset Password</h1>

        <p className="text-gray-500 text-center mb-8">
          Reset your password using your mobile number.
        </p>

        {/* Error */}

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 border border-red-300 text-red-700 p-3 text-sm">
            {error}
          </div>
        )}

        {/* Success */}

        {message && (
          <div className="mb-5 rounded-lg bg-green-100 border border-green-300 text-green-700 p-3 text-sm">
            {message}
          </div>
        )}

        {/* ---------------------------------
            STEP 1 - MOBILE NUMBER
        ---------------------------------- */}

        {!otpSent && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block mb-2 font-medium">Mobile Number</label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter your 10-digit mobile number"
                value={mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);

                  setMobile(value);
                }}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* ---------------------------------
            STEP 2 - OTP
        ---------------------------------- */}

        {otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block mb-2 font-medium">Enter OTP</label>

              <p className="text-sm text-gray-500 mb-3">
                We sent a 6-digit OTP to{" "}
                <span className="font-semibold text-gray-700">{mobile}</span>
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);

                  setOtp(value);
                }}
                className="w-full border rounded-lg p-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setMessage("");
                setError("");
              }}
              disabled={loading}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Change Mobile Number
            </button>
          </form>
        )}

        {/* Back */}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
          >
            Use security question instead
          </button>
        </div>
      </div>
    </div>
  );
}
