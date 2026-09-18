// app/seller/mobiles/products/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProductForm from "@/components/seller/mobiles/ProductForm";

interface ProductColor {
  name: string;
  isAvailable: boolean;
  price: string | number | null;
}

interface CameraData {
  front: string;
  rear: string;
}

interface ProductFormData {
  productName: string;
  brand: string;
  description: string;

  // Variant
  variantName: string;
  variantGroupId: string;

  // Specifications
  ram: string;
  storage: string;
  processor: string;
  display: string;
  camera: CameraData;
  battery: string;
  operatingSystem: string;
  warranty: string;
  charging: string;

  // Colours
  colors: ProductColor[];

  // Pricing
  price: string | number;
  discountPrice: string | number;

  // Availability
  isAvailable: boolean;
}

export default function AddMobileProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    data: ProductFormData,
    mainImage: File | null,
    descriptionImages: File[],
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();

      /* =====================================================
         BASIC PRODUCT INFORMATION
      ===================================================== */

      formData.append("productName", data.productName);
      formData.append("brand", data.brand);
      formData.append("description", data.description);

      /* =====================================================
         VARIANT
      ===================================================== */

      // Optional variant name
      if (data.variantName?.trim()) {
        formData.append("variantName", data.variantName.trim());
      }

      // Optional variant group ID
      //
      // Products belonging to the same mobile model but
      // having different RAM/storage variants can use the
      // same variantGroupId.
      //
      // Example:
      // iPhone 16 128GB -> groupId: iphone-16
      // iPhone 16 256GB -> groupId: iphone-16
      //
      if (data.variantGroupId?.trim()) {
        formData.append("variantGroupId", data.variantGroupId.trim());
      }

      /* =====================================================
         MOBILE SPECIFICATIONS
      ===================================================== */

      formData.append("ram", data.ram);
      formData.append("storage", data.storage);
      formData.append("processor", data.processor);
      formData.append("display", data.display);

      // Backend expects camera as a JSON string because
      // this request uses multipart/form-data.
      //
      // Example:
      // {
      //   front: "12 MP",
      //   rear: "48 MP + 12 MP + 8 MP"
      // }
      formData.append("camera", JSON.stringify(data.camera));

      formData.append("battery", data.battery);
      formData.append("operatingSystem", data.operatingSystem);
      formData.append("warranty", data.warranty?.trim() || "");
      formData.append("charging", data.charging);

      /* =====================================================
         COLORS
      ===================================================== */

      // Backend expects colors as a JSON string because this
      // request uses multipart/form-data.
      //
      // null price means:
      // use the main product price.

      const colors = Array.isArray(data.colors)
        ? data.colors
            .filter((color) => color?.name?.trim())
            .map((color) => ({
              name: color.name.trim(),
              isAvailable: Boolean(color.isAvailable),
              price:
                color.price === "" ||
                color.price === undefined ||
                color.price === null
                  ? null
                  : Number(color.price),
            }))
        : [];

      formData.append("colors", JSON.stringify(colors));

      /* =====================================================
         PRICING
      ===================================================== */

      formData.append("price", String(data.price));

      if (
        data.discountPrice !== "" &&
        data.discountPrice !== null &&
        data.discountPrice !== undefined
      ) {
        formData.append("discountPrice", String(data.discountPrice));
      }

      /* =====================================================
         PRODUCT AVAILABILITY
      ===================================================== */

      formData.append("isAvailable", String(data.isAvailable));

      /* =====================================================
         MAIN IMAGE
      ===================================================== */

      if (mainImage) {
        formData.append("mainImage", mainImage);
      }

      /* =====================================================
         DESCRIPTION IMAGES
      ===================================================== */

      // Images are appended individually.
      // ProductForm allows selecting all 6 at once or
      // adding them one by one.

      descriptionImages.forEach((image) => {
        formData.append("descriptionImages", image);
      });

      /* =====================================================
         API REQUEST
      ===================================================== */

      const response = await api.post("/seller/mobile/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Failed to create product");
      }

      alert("Mobile product added successfully.");

      router.push("/seller/mobiles/products");
    } catch (error: any) {
      console.error("Create mobile product error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add mobile product.";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Add Mobile Product
        </h1>

        <p className="text-gray-500 mt-1">
          Add a new mobile product to your store.
        </p>
      </div>

      <ProductForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
