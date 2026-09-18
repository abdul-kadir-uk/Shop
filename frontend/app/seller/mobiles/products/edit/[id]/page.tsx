// app/seller/mobiles/products/edit/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import api from "@/lib/api";
import ProductForm from "@/components/seller/mobiles/ProductForm";

interface ProductImage {
  url: string;
  key: string;
}

interface ProductColor {
  name: string;
  isAvailable: boolean;
  price: number | null;
}

interface CameraData {
  front: string;
  rear: string;
}

interface MobileProduct {
  _id: string;

  productName: string;
  slug: string;

  brand: string;
  description: string;

  variantGroupId: string | null;
  variantName: string;

  ram: string;
  storage: string;

  colors: ProductColor[];

  processor: string;
  display: string;
  camera: CameraData;
  battery: string;
  operatingSystem: string;
  warranty: string;
  charging: string;

  mainImage: ProductImage;
  descriptionImages: ProductImage[];

  price: number;
  discountPrice: number | null;

  isAvailable: boolean;

  totalSold: number;
}

export default function EditMobileProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [product, setProduct] = useState<MobileProduct | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [existingDescriptionImages, setExistingDescriptionImages] = useState<
    ProductImage[]
  >([]);

  /* ==========================================================
     FETCH PRODUCT
  ========================================================== */

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const { data } = await api.get(`/seller/mobile/products/${id}`);

        const fetchedProduct = data.product;

        setProduct(fetchedProduct);

        setExistingDescriptionImages(fetchedProduct.descriptionImages || []);
      } catch (error: any) {
        console.error("Failed to fetch mobile product:", error);

        alert(
          error.response?.data?.message || "Failed to load mobile product.",
        );

        router.push("/seller/mobiles/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  /* ==========================================================
     REMOVE EXISTING DESCRIPTION IMAGE
  ========================================================== */

  const handleRemoveExistingDescriptionImage = (key: string) => {
    setExistingDescriptionImages((prev) =>
      prev.filter((image) => image.key !== key),
    );
  };

  /* ==========================================================
     UPDATE PRODUCT
  ========================================================== */

  const handleSubmit = async (
    data: any,
    mainImage: File | null,
    descriptionImages: File[],
  ) => {
    try {
      setSaving(true);

      const formData = new FormData();

      /* -------------------------------------------------------
         BASIC FIELDS
      ------------------------------------------------------- */

      formData.append("productName", data.productName?.trim() || "");

      formData.append("brand", data.brand?.trim() || "");

      formData.append("description", data.description || "");

      /* -------------------------------------------------------
         VARIANT
      ------------------------------------------------------- */

      formData.append("variantName", data.variantName?.trim() || "");

      formData.append("variantGroupId", data.variantGroupId?.trim() || "");

      /* -------------------------------------------------------
         SPECIFICATIONS
      ------------------------------------------------------- */

      formData.append("ram", data.ram?.trim() || "");

      formData.append("storage", data.storage?.trim() || "");

      formData.append("processor", data.processor?.trim() || "");

      formData.append("display", data.display?.trim() || "");

      /*
       * Camera is now an object:
       *
       * {
       *   front: "...",
       *   rear: "..."
       * }
       *
       * Send it as JSON because this request is multipart/form-data.
       */
      const camera: CameraData = {
        front: data.camera?.front?.trim() || "",
        rear: data.camera?.rear?.trim() || "",
      };

      formData.append("camera", JSON.stringify(camera));

      formData.append("battery", data.battery?.trim() || "");

      formData.append("operatingSystem", data.operatingSystem?.trim() || "");

      formData.append("warranty", data.warranty?.trim() || "");

      formData.append("charging", data.charging?.trim() || "");

      /* -------------------------------------------------------
         COLORS
      ------------------------------------------------------- */

      const colors = Array.isArray(data.colors)
        ? data.colors
            .filter((color: ProductColor) => color?.name?.trim())
            .map((color: ProductColor) => ({
              name: color.name.trim(),

              isAvailable: Boolean(color.isAvailable),

              price: color.price === null ? null : Number(color.price),
            }))
        : [];

      formData.append("colors", JSON.stringify(colors));

      /* -------------------------------------------------------
         PRICE
      ------------------------------------------------------- */

      if (
        data.price !== undefined &&
        data.price !== null &&
        data.price !== ""
      ) {
        formData.append("price", String(data.price));
      }

      if (
        data.discountPrice !== undefined &&
        data.discountPrice !== null &&
        data.discountPrice !== ""
      ) {
        formData.append("discountPrice", String(data.discountPrice));
      } else {
        /*
         * Empty string tells backend to clear discountPrice.
         */
        formData.append("discountPrice", "");
      }

      /* -------------------------------------------------------
         AVAILABILITY
      ------------------------------------------------------- */

      formData.append("isAvailable", String(Boolean(data.isAvailable)));

      /* -------------------------------------------------------
         EXISTING DESCRIPTION IMAGES
         
         Backend uses these keys to decide which existing
         images should remain.
      ------------------------------------------------------- */

      formData.append(
        "keepDescriptionImages",
        JSON.stringify(existingDescriptionImages.map((image) => image.key)),
      );

      /* -------------------------------------------------------
         MAIN IMAGE
         
         Only append when seller selected a new image.
         Existing image remains otherwise.
      ------------------------------------------------------- */

      if (mainImage) {
        formData.append("mainImage", mainImage);
      }

      /* -------------------------------------------------------
         NEW DESCRIPTION IMAGES
      ------------------------------------------------------- */

      descriptionImages.forEach((file) => {
        formData.append("descriptionImages", file);
      });

      /* -------------------------------------------------------
         UPDATE API
      ------------------------------------------------------- */

      const { data: responseData } = await api.put(
        `/seller/mobile/products/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      alert(responseData?.message || "Mobile product updated successfully.");

      router.push("/seller/mobiles/products");
    } catch (error: any) {
      console.error("Update mobile product error:", error);

      alert(
        error.response?.data?.message || "Failed to update mobile product.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-gray-500 text-lg">Loading product...</div>
      </div>
    );
  }

  /* ==========================================================
     PRODUCT NOT FOUND
  ========================================================== */

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <h2 className="text-xl font-semibold">Mobile product not found</h2>

        <button
          type="button"
          onClick={() => router.push("/seller/mobiles/products")}
          className="
            mt-4
            bg-gray-700
            hover:bg-gray-800
            text-white
            px-5
            py-2
            rounded-lg
          "
        >
          Back to Products
        </button>
      </div>
    );
  }

  /* ==========================================================
     INITIAL DATA FOR PRODUCT FORM
  ========================================================== */

  const initialData = {
    productName: product.productName,

    brand: product.brand,

    description: product.description || "",

    variantGroupId: product.variantGroupId || "",

    variantName: product.variantName || "",

    ram: product.ram || "",

    storage: product.storage || "",

    colors: product.colors || [],

    processor: product.processor || "",

    display: product.display || "",

    camera: {
      front: product.camera?.front || "",
      rear: product.camera?.rear || "",
    },

    battery: product.battery || "",

    operatingSystem: product.operatingSystem || "",

    warranty: product.warranty || "",

    charging: product.charging || "",

    price: product.price,

    discountPrice: product.discountPrice === null ? "" : product.discountPrice,

    isAvailable: product.isAvailable,
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Edit Mobile Product</h1>

        <p className="text-gray-500 mt-1">
          Update your mobile product details.
        </p>
      </div>

      {/* Product Form */}

      <ProductForm
        initialData={initialData}
        existingMainImage={product.mainImage?.url}
        existingDescriptionImages={existingDescriptionImages}
        onRemoveExistingDescriptionImage={handleRemoveExistingDescriptionImage}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </div>
  );
}
