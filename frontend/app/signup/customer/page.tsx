"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function CustomerSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear error when user edits password fields
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords and Confirm Password Are Mismatch");
      return;
    }

    if (formData.password.length < 6) {
      setError("Passwords Must be of Minimum 6 didgits");
      return;
    }

    if (formData.phone.length !== 10) {
      setError("Enter correct Mobile Number");
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
        router.push("/signupSuccessfull");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
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
            onChange={handleChange}
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition cursor-pointer"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
          {/* Password Match Error */}
        </form>
      </div>
    </div>
  );
}
