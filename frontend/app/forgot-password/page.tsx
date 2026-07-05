"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    securityQuestion: "",
    securityAnswer: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/verify-security",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      // Save reset token for reset-password page
      localStorage.setItem("resetToken", data.resetToken);

      alert(data.message);

      router.push("/reset-password");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Forgot Password</h1>

        <p className="text-gray-500 text-center mb-8">
          Verify your identity to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block mb-2 font-medium">Email Address</label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Security Question */}
          <div>
            <label className="block mb-2 font-medium">Security Question</label>

            <select
              name="securityQuestion"
              value={formData.securityQuestion}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select a Security Question</option>
              <option value="pet">What was your first pet's name?</option>
              <option value="city">In which city were you born?</option>
              <option value="school">
                What was the name of your first school?
              </option>
              <option value="teacher">Who was your favorite teacher?</option>
              <option value="movie">What is your favorite movie?</option>
            </select>
          </div>

          {/* Security Answer */}
          <div>
            <label className="block mb-2 font-medium">Security Answer</label>

            <input
              type="text"
              name="securityAnswer"
              placeholder="Enter your answer"
              value={formData.securityAnswer}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
