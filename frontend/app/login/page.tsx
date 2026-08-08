"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

import { useAuth } from "@/context/authContext";
import { setAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const { loading: authLoading, isLoggedIn, user, checkAuth } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading || !isLoggedIn || !user) return;

    switch (user.role) {
      case "customer":
        router.replace("/customer/dashboard");
        break;

      case "seller":
        if (user.approvalStatus === "pending") {
          router.replace("/signup/seller/under-review");
        } else if (user.approvalStatus === "rejected") {
          router.replace("/signup/seller/rejected");
        } else {
          router.replace("/seller/dashboard");
        }
        break;

      case "delivery":
        if (user.approvalStatus === "pending") {
          router.replace("/signup/delivery/under-review");
        } else if (user.approvalStatus === "rejected") {
          router.replace("/signup/delivery/rejected");
        } else {
          router.replace("/delivery/dashboard");
        }
        break;

      default:
        router.replace("/");
    }
  }, [authLoading, isLoggedIn, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", formData);

      // Save token, user and role
      setAuth(data.token, data.user, data.user.role);

      // Refresh Auth Context immediately
      await checkAuth();

      const { role, approvalStatus } = data.user;

      switch (role) {
        case "customer":
          router.replace("/customer/dashboard");
          break;

        case "seller":
          if (approvalStatus === "pending") {
            router.replace("/signup/seller/under-review");
          } else if (approvalStatus === "rejected") {
            router.replace("/signup/seller/rejected");
          } else {
            router.replace("/seller/dashboard");
          }
          break;

        case "delivery":
          if (approvalStatus === "pending") {
            router.replace("/signup/delivery/under-review");
          } else if (approvalStatus === "rejected") {
            router.replace("/signup/delivery/rejected");
          } else {
            router.replace("/delivery/dashboard");
          }
          break;

        default:
          alert("Unknown user role");
      }
    } catch (error: any) {
      console.error(error);

      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">Loading...</div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <h1 className="text-4xl font-bold mb-6">Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="text"
          name="identifier"
          placeholder="Mobile or Email"
          value={formData.identifier}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-3 pr-14 rounded-lg"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="text-center">
          <p className="text-sm">
            Don't have an account?{" "}
            <Link
              href="/signup/customer"
              className="text-blue-600 font-medium hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
