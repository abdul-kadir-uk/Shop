"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/authContext";
import api from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();

  const { loading, isLoggedIn, user, logoutUser } = useAuth();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, router]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Ignore API errors and logout locally
    }

    logoutUser();

    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">Loading...</div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow border p-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="space-y-6">
          <div>
            <p className="text-gray-500 text-sm">Name</p>

            <p className="text-lg font-medium">{user?.name}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Email</p>

            <p className="text-lg font-medium">{user?.email}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Mobile Number</p>

            <p className="text-lg font-medium">{user?.mobile}</p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
