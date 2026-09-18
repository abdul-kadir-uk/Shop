// app/mobiles/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import api from "@/lib/api";

import ProductGallery from "@/components/mobiles/product details/ProductGallery";
import ProductInfo from "@/components/mobiles/product details/ProductInfo";

type ProductImage = {
  url: string;
  key?: string;
};

type MobileColor = {
  name: string;
  isAvailable: boolean;
  price: number | null;
};

type MobileVariant = {
  _id: string;
  slug: string;
  productName: string;
  variantName?: string;
  ram: string;
  storage: string;
  price: number;
  discountPrice: number | null;
  mainImage?: {
    url: string;
    key?: string;
  };
};

type MobileProduct = {
  _id: string;
  productName: string;
  slug: string;

  brand: string;
  description: string;

  variantGroupId?: string | null;
  variantName?: string;

  ram: string;
  storage: string;

  colors: MobileColor[];

  processor: string;
  display: string;

  camera: {
    front: string;
    rear: string;
  };

  battery: string;
  operatingSystem: string;
  warranty: string;
  charging: string;

  mainImage: ProductImage;
  descriptionImages?: ProductImage[];

  price: number;
  discountPrice: number | null;

  variants?: MobileVariant[];

  isAvailable: boolean;
  totalSold: number;

  isDeleted: boolean;
};

export default function MobileProductDetailsPage() {
  const params = useParams<{ slug: string }>();

  const slug = params?.slug;

  const [product, setProduct] = useState<MobileProduct | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/mobiles/${encodeURIComponent(slug)}`);

        const fetchedProduct = response.data?.product || null;

        if (fetchedProduct) {
          fetchedProduct.variants = response.data?.variants || [];
        }

        setProduct(fetchedProduct);
      } catch (error: any) {
        console.error("Failed to fetch mobile product:", error);

        setProduct(null);

        if (error?.response?.status === 404) {
          setError("Mobile product not found.");
        } else {
          setError("Failed to load mobile product.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex min-h-75 items-center justify-center">
            <p className="text-gray-500">Loading mobile product...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex min-h-75 items-center justify-center">
            <p className="text-center text-gray-500">
              {error || "Mobile product not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ==================================================
              LEFT - PRODUCT IMAGES
          ================================================== */}

          <ProductGallery product={product} />

          {/* ==================================================
              RIGHT - PRODUCT INFORMATION
          ================================================== */}

          <ProductInfo product={product} />
        </div>
      </div>
    </main>
  );
}
