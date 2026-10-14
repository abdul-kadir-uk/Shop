// app/seller/medicine/products/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pill } from "lucide-react";
import api from "@/lib/api";
import MedicineProductForm, {
  type MedicineProductFormData,
} from "@/components/seller/medicine/MedicineProductForm";

export default function AddMedicineProductPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (
    data: MedicineProductFormData,
    mainImage: File | null,
    descriptionImages: File[],
  ) => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // A main image is required when creating a new product.
      if (!mainImage) {
        setError("Please select a main product image.");
        return;
      }

      const formData = new FormData();

      formData.append("productName", data.productName.trim());
      formData.append("description", data.description);
      formData.append("brand", data.brand);
      formData.append("manufacturer", data.manufacturer);

      formData.append("productCategory", data.productCategory.trim());
      formData.append("productSubCategory", data.productSubCategory.trim());

      formData.append("composition", data.composition);
      formData.append("strength", data.strength);
      formData.append("dosageForm", data.dosageForm);
      formData.append("packSize", data.packSize);

      formData.append(
        "requiresPrescription",
        String(data.requiresPrescription),
      );

      formData.append("batchNumber", data.batchNumber);
      formData.append("manufacturingDate", data.manufacturingDate);
      formData.append("expiryDate", data.expiryDate);

      formData.append("price", String(data.price));
      formData.append("discountPrice", String(data.discountPrice));
      formData.append("quantity", String(data.quantity));
      formData.append("unit", data.unit);
      formData.append("stock", String(data.stock));

      formData.append("trackInventory", String(data.trackInventory));
      formData.append("isAvailable", String(data.isAvailable));
      formData.append("status", data.status);

      formData.append("variants", JSON.stringify(data.variants));

      // These field names must match the backend upload middleware.
      formData.append("mainImage", mainImage);

      descriptionImages.forEach((image) => {
        formData.append("descriptionImages", image);
      });

      const response = await api.post("/seller/medicine/products", formData);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to create medicine product.",
        );
      }

      setSuccess(
        response.data.message || "Medicine product created successfully.",
      );

      router.push("/seller/medicine/products");
      router.refresh();
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (
              err as {
                response?: {
                  data?: { message?: string };
                };
              }
            ).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Something went wrong while saving the product.";

      setError(message || "Unable to create medicine product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/seller/medicine/products"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Pill size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Add Medicine Product
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Add medicine details, pricing, stock and images.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      <MedicineProductForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
