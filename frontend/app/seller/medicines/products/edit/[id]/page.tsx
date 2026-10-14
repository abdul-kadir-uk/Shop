"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import api from "@/lib/api";
import MedicineProductForm, {
  type MedicineProductFormData,
} from "@/components/seller/medicine/MedicineProductForm";

type ExistingImage = {
  key: string;
  url: string;
};

type MedicineProduct = Partial<MedicineProductFormData> & {
  _id: string;
  mainImage?: ExistingImage;
  descriptionImages?: ExistingImage[];
};

export default function EditMedicineProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [product, setProduct] = useState<MedicineProduct | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setFetching(false);
      return;
    }

    try {
      setFetching(true);

      const { data } = await api.get(`/seller/medicine/products/${id}`);

      if (!data?.product) {
        throw new Error("Medicine product was not found.");
      }

      setProduct(data.product);
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to load medicine product.",
      );

      setProduct(null);
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  const handleSubmit = async (
    formData: MedicineProductFormData,
    mainImage: File | null,
    descriptionImages: File[],
    keepDescriptionImages: ExistingImage[] = [],
  ) => {
    try {
      setLoading(true);

      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "variants") {
          data.append("variants", JSON.stringify(value));
          return;
        }

        if (value !== undefined && value !== null) {
          data.append(key, String(value));
        }
      });

      // Main image is optional during editing.
      // If omitted, the backend should retain the current main image.
      if (mainImage) {
        data.append("mainImage", mainImage);
      }

      descriptionImages.forEach((image) => {
        data.append("descriptionImages", image);
      });

      // Send only existing description images that the seller kept.
      data.append(
        "keepDescriptionImages",
        JSON.stringify(keepDescriptionImages.map((image) => image.key)),
      );

      await api.put(`/seller/medicine/products/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Medicine product updated successfully.");

      router.push("/seller/medicine/products");
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message || "Failed to update medicine product.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="py-20 text-center">Loading medicine product...</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl py-20 text-center">
        <p className="text-gray-600">Medicine product could not be loaded.</p>

        <button
          type="button"
          onClick={() => router.push("/seller/medicine/products")}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Back to Medicine Products
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border bg-white shadow">
        <div className="border-b px-6 py-6">
          <h1 className="text-3xl font-bold">Edit Medicine Product</h1>

          <p className="mt-2 text-gray-500">
            Update medicine details, pricing, stock, variants, and images.
          </p>
        </div>

        <div className="p-4 sm:p-8">
          <MedicineProductForm
            key={product._id}
            initialData={product}
            existingMainImage={product.mainImage?.url || ""}
            existingDescriptionImages={product.descriptionImages || []}
            onSubmit={handleSubmit}
            submitting={loading}
          />
        </div>
      </div>
    </div>
  );
}
