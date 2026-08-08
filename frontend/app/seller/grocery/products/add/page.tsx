// products/add/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ProductForm from "@/components/seller/ProductForm";
import api from "@/lib/api";

export default function AddProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    data: any,
    mainImage: File | null,
    descriptionImages: File[],
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();

      // ==========================
      // Product Details
      // ==========================

      formData.append("productName", data.productName);
      formData.append("description", data.description || "");
      formData.append("brand", data.brand);

      formData.append("productCategory", data.productCategory);
      formData.append("productSubCategory", data.productSubCategory);

      if (data.variants?.length > 0) {
        const defaultVariant =
          data.variants.find((v: any) => v.isDefault) || data.variants[0];

        formData.append("price", String(defaultVariant.price));

        formData.append(
          "discountPrice",
          defaultVariant.discountPrice
            ? String(defaultVariant.discountPrice)
            : "",
        );

        formData.append("quantity", String(defaultVariant.quantity));

        formData.append("unit", defaultVariant.unit);
        formData.append("stock", String(defaultVariant.stock));
      } else {
        formData.append("price", String(data.price));

        formData.append(
          "discountPrice",
          data.discountPrice ? String(data.discountPrice) : "",
        );

        formData.append("quantity", String(data.quantity));

        formData.append("unit", data.unit);

        formData.append("stock", String(data.stock || 0));
      }

      formData.append("isAvailable", String(data.isAvailable));

      // ==========================
      // Variants
      // ==========================

      formData.append("variants", JSON.stringify(data.variants));

      // ==========================
      // Images
      // ==========================

      if (mainImage) {
        formData.append("mainImage", mainImage);
      }

      descriptionImages.forEach((image) => {
        formData.append("descriptionImages", image);
      });

      // ==========================
      // API
      // ==========================

      const response = await api.post("/seller/grocery/products", formData);

      alert(response.data.message || "Product created successfully.");

      router.push("/seller/grocery/products");
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow border">
        <div className="border-b px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Add New Product</h1>

          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Fill in the details below to add a new product.
          </p>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <ProductForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  );
}
