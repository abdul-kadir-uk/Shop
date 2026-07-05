"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function DeliverySignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    aadhaarNumber: "",
    securityQuestion: "",
    securityAnswer: "",
    address: "",
  });

  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.mobileNumber ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.aadhaarNumber ||
      !formData.securityQuestion ||
      !formData.securityAnswer ||
      !formData.address
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.mobileNumber.length !== 10) {
      setError("Mobile number must be 10 digits.");
      return;
    }

    if (formData.aadhaarNumber.length !== 12) {
      setError("Aadhaar number must be 12 digits.");
      return;
    }

    if (!aadhaarFile) {
      setError("Please upload Aadhaar document.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post(
        "http://localhost:5000/api/auth/delivery/signup",
        {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobileNumber,
          password: formData.password,
          aadhaarNumber: formData.aadhaarNumber,
          aadhaarDocument: aadhaarFile.name,
          address: formData.address,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer.trim().toLowerCase(),
        },
      );

      if (data.success) {
        router.push("/signup/delivery/under-review");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Delivery Partner Registration
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Join our delivery network and start earning.
        </p>

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 border border-red-300 text-red-700 p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="tel"
            name="mobileNumber"
            placeholder="Mobile Number"
            value={formData.mobileNumber}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="tel"
            name="aadhaarNumber"
            placeholder="Aadhaar Number"
            value={formData.aadhaarNumber}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <div>
            <label className="block mb-2 font-medium">
              Upload Aadhaar Card
            </label>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
              className="w-full border rounded-xl p-3"
            />
          </div>

          <select
            name="securityQuestion"
            value={formData.securityQuestion}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Security Question</option>
            <option value="pet">What was your first pet's name?</option>
            <option value="school">What was your primary school name?</option>
            <option value="city">In which city were you born?</option>
            <option value="teacher">
              What was your favorite teacher's name?
            </option>
          </select>

          <input
            type="text"
            name="securityAnswer"
            placeholder="Security Answer"
            value={formData.securityAnswer}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <textarea
            name="address"
            placeholder="Full Address"
            value={formData.address}
            onChange={handleChange}
            rows={4}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
