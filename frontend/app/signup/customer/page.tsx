// app/signup/customer/page.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function CustomerSignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
    address: "",
  });

  const [error, setError] = useState("");

  // --------------------------------------------------
  // Form change
  // --------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setError("");
    }
  };

  // --------------------------------------------------
  // Start resend cooldown
  // --------------------------------------------------

  const startResendCooldown = () => {
    setResendCooldown(60);

    const interval = setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);
  };

  // --------------------------------------------------
  // Validate signup form
  // --------------------------------------------------

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords and Confirm Password Are Mismatch");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Passwords Must be of Minimum 6 didgits");
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Enter correct Mobile Number");
      return false;
    }

    if (!formData.securityQuestion) {
      setError("Please select a security question");
      return false;
    }

    if (!formData.securityAnswer.trim()) {
      setError("Please enter your security answer");
      return false;
    }

    if (!formData.address.trim()) {
      setError("Please enter your address");
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // Send OTP
  // --------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await axios.post(
        "http://localhost:5000/api/auth/customer/signup",
        {
          name: formData.fullName,
          email: formData.email,
          mobile: formData.phone,
          password: formData.password,
          address: formData.address,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer.trim().toLowerCase(),
        },
      );

      if (data.success) {
        setOtpSent(true);
        startResendCooldown();
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Verify OTP
  // --------------------------------------------------

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP");
      return;
    }

    try {
      setOtpLoading(true);
      setError("");

      const { data } = await axios.post(
        "http://localhost:5000/api/auth/customer/signup/verify-otp",
        {
          mobile: formData.phone,
          otp,
        },
      );

      if (data.success) {
        // --------------------------------------------------
        // Save authentication information
        // --------------------------------------------------

        localStorage.setItem("token", data.token);

        localStorage.setItem("user", JSON.stringify(data.user));

        localStorage.setItem("role", "customer");

        router.push("/signupSuccessfull");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Invalid OTP. Please try again.",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // --------------------------------------------------
  // Resend OTP
  // --------------------------------------------------

  const handleResendOtp = async () => {
    if (resendCooldown > 0) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setOtpLoading(true);
      setError("");

      const { data } = await axios.post(
        "http://localhost:5000/api/auth/customer/signup",
        {
          name: formData.fullName,
          email: formData.email,
          mobile: formData.phone,
          password: formData.password,
          address: formData.address,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer.trim().toLowerCase(),
        },
      );

      if (data.success) {
        setOtp("");
        startResendCooldown();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ==================================================
  // OTP SCREEN
  // ==================================================

  if (otpSent) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-center mb-2">
            Verify Mobile Number
          </h1>

          <p className="text-gray-500 text-center mb-6">
            We sent a 6-digit OTP to
          </p>

          <p className="text-center font-semibold mb-6">+91 {formData.phone}</p>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");

                setOtp(value);
                setError("");
              }}
              className="w-full border rounded-lg p-3 text-center text-xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-green-500"
              required
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={otpLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition cursor-pointer"
            >
              {otpLoading ? "Verifying..." : "Verify & Create Account"}
            </button>
          </form>

          <div className="text-center mt-5">
            {resendCooldown > 0 ? (
              <p className="text-gray-500 text-sm">
                Resend OTP in {resendCooldown}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpLoading}
                className="text-green-600 font-medium hover:text-green-700 cursor-pointer"
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
              setError("");
            }}
            className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm cursor-pointer"
          >
            Change mobile number
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // SIGNUP FORM
  // ==================================================

  return (
    <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-center mb-2">
          Customer Sign Up
        </h1>

        <p className="text-gray-500 text-center mb-6">
          Create your customer account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          {/* Email */}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          {/* Phone */}

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");

              if (value.length <= 10) {
                setFormData({
                  ...formData,
                  phone: value,
                });
              }

              setError("");
            }}
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
            maxLength={10}
            required
          />

          {/* Password */}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 pr-16 outline-none focus:ring-2 focus:ring-green-500"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-green-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Confirm Password */}

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 pr-16 outline-none focus:ring-2 focus:ring-green-500"
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-green-600"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Security Question */}

          <select
            name="securityQuestion"
            value={formData.securityQuestion}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select Security Question</option>

            <option value="pet">What was your first pet's name?</option>

            <option value="school">What was your primary school name?</option>

            <option value="city">In which city were you born?</option>

            <option value="teacher">
              What was your favorite teacher's name?
            </option>
          </select>

          {/* Security Answer */}

          <input
            type="text"
            name="securityAnswer"
            placeholder="Security Answer"
            value={formData.securityAnswer}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          {/* Address */}

          <textarea
            name="address"
            placeholder="Full Address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500 resize-none"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition cursor-pointer"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
