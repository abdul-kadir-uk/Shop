"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SellerSignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    shopName: "",
    category: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
    address: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    // Live password match validation
    if (
      name === "confirmPassword" ||
      (name === "password" && formData.confirmPassword)
    ) {
      const password = name === "password" ? value : formData.password;

      const confirmPassword =
        name === "confirmPassword" ? value : formData.confirmPassword;

      if (confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword:
            password === confirmPassword ? "" : "Passwords do not match",
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key] = "This field is required";
      }
    });

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const { data } = await axios.post(
        "http://localhost:5000/api/auth/seller/signup",
        {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          shopName: formData.shopName,
          category: formData.category,
          address: formData.address,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer.trim().toLowerCase(),
        },
      );

      if (data.success) {
        router.push("/signup/seller/under-review");
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Seller Registration
        </h1>

        <p className="mb-8 text-center text-gray-500">
          Create your seller account to start selling.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="mb-1 block font-medium">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full rounded-lg border px-4 py-3 focus:border-green-500 focus:outline-none"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email + Mobile */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="w-full rounded-lg border px-4 py-3 focus:border-green-500 focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-medium">Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                className="w-full rounded-lg border px-4 py-3 focus:border-green-500 focus:outline-none"
              />
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
              )}
            </div>
          </div>

          {/* Shop Name */}
          <div>
            <label className="mb-1 block font-medium">Shop Name *</label>
            <input
              type="text"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              placeholder="Enter shop name"
              className="w-full rounded-lg border px-4 py-3 focus:border-green-500 focus:outline-none"
            />
            {errors.shopName && (
              <p className="mt-1 text-sm text-red-500">{errors.shopName}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block font-medium">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-3 focus:border-green-500 focus:outline-none"
            >
              <option value="">Select Category</option>
              <option value="groceries">Groceries</option>
              <option value="mobile-repair">Mobile Repair</option>
            </select>

            {errors.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Passwords */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">Password *</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full rounded-lg border px-4 py-3 pr-16 focus:border-green-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Confirm Password *
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className="w-full rounded-lg border px-4 py-3 pr-16 focus:border-green-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Security Question */}
          <div>
            <label className="mb-1 block font-medium">
              Security Question *
            </label>

            <select
              name="securityQuestion"
              value={formData.securityQuestion}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-3 focus:border-green-500 focus:outline-none"
            >
              <option value="">Select a question</option>
              <option value="pet">What was the name of your first pet?</option>
              <option value="school">
                What was the name of your first school?
              </option>
              <option value="city">In which city were you born?</option>
              <option value="mother">What is your mother's maiden name?</option>
            </select>

            {errors.securityQuestion && (
              <p className="mt-1 text-sm text-red-500">
                {errors.securityQuestion}
              </p>
            )}
          </div>

          {/* Security Answer */}
          <div>
            <label className="mb-1 block font-medium">Security Answer *</label>

            <input
              type="text"
              name="securityAnswer"
              value={formData.securityAnswer}
              onChange={handleChange}
              placeholder="Enter your answer"
              className="w-full rounded-lg border px-4 py-3 focus:border-green-500 focus:outline-none"
            />

            {errors.securityAnswer && (
              <p className="mt-1 text-sm text-red-500">
                {errors.securityAnswer}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="mb-1 block font-medium">Address *</label>

            <textarea
              rows={4}
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              className="w-full rounded-lg border px-4 py-3 focus:border-green-500 focus:outline-none"
            />

            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? "Creating Account..." : "Create Seller Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
