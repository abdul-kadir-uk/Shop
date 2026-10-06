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
  descriptionImages?: ProductImage[];
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

  processor: string;
  display: string;

  simCardSlots: string;
  connectorType: string;
  batteryCapacity: string;
  weight: string;
  displayType: string;
  screenSize: string;
  networkSupport: string;
  insideBox: string;

  colors: MobileColor[];

  camera: {
    front: string;
    rear: string;
  };

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

  // ==========================================================
  // SELECTED COLOR
  // ==========================================================

  const [selectedColorIndex, setSelectedColorIndex] = useState(-1);

  const selectedColor =
    product && selectedColorIndex >= 0
      ? product.colors?.[selectedColorIndex] || null
      : null;

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

          // Select the first available color by default.
          const firstAvailableIndex = fetchedProduct.colors?.findIndex(
            (color: MobileColor) => color.isAvailable,
          );

          setSelectedColorIndex(
            firstAvailableIndex >= 0 ? firstAvailableIndex : -1,
          );
        } else {
          setSelectedColorIndex(-1);
        }

        setProduct(fetchedProduct);
      } catch (error: any) {
        console.error("Failed to fetch mobile product:", error);

        setProduct(null);
        setSelectedColorIndex(-1);

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

          <ProductGallery product={product} selectedColor={selectedColor} />

          {/* ==================================================
              RIGHT - PRODUCT INFORMATION
          ================================================== */}

          <ProductInfo
            product={product}
            selectedColorIndex={selectedColorIndex}
            onColorChange={setSelectedColorIndex}
          />
        </div>
      </div>
    </main>
  );
}
