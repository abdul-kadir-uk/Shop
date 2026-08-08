"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import api from "@/lib/api";
import ProductForm from "@/components/seller/ProductForm";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [product, setProduct] = useState<any>(null);

  const [existingDescriptionImages, setExistingDescriptionImages] = useState<
    { key: string; url: string }[]
  >([]);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/seller/grocery/products/${id}`);

      const productData = data.product;

      setProduct(productData);

      setExistingDescriptionImages(productData.descriptionImages || []);
    } catch (error) {
      console.error(error);
      alert("Unable to load product.");
    } finally {
      setFetching(false);
    }
  };

  const removeExistingImage = (key: string) => {
    setExistingDescriptionImages((prev) =>
      prev.filter((image) => image.key !== key),
    );
  };

  const handleSubmit = async (
    formData: any,
    mainImage: File | null,
    descriptionImages: File[],
  ) => {
    try {
      setLoading(true);

      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "variants") {
          data.append("variants", JSON.stringify(value));
        } else {
          data.append(key, String(value));
        }
      });

      if (mainImage) {
        data.append("mainImage", mainImage);
      }

      descriptionImages.forEach((image) => {
        data.append("descriptionImages", image);
      });

      data.append(
        "keepDescriptionImages",
        JSON.stringify(existingDescriptionImages.map((img) => img.key)),
      );

      await api.put(`/seller/grocery/products/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Product updated successfully.");

      router.push("/seller/grocery/products");
    } catch (error: any) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-20">Loading product...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow border">
        <div className="border-b px-6 py-6">
          <h1 className="text-3xl font-bold">Edit Product</h1>

          <p className="text-gray-500 mt-2">Update your grocery product.</p>
        </div>

        <div className="p-8">
          <ProductForm
            initialData={product}
            existingMainImage={product.mainImage?.url}
            existingDescriptionImages={existingDescriptionImages}
            onRemoveExistingDescriptionImage={removeExistingImage}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
