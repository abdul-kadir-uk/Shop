// App/groceries/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getSingleGrocery } from "@/lib/groceryApi";

import ProductGallery from "@/components/groceries/product details/ProductGallery";
import ProductInfo from "@/components/groceries/product details/ProductInfo";

type Product = {
  _id: string;
  productName: string;
  slug: string;
  description: string;

  brand: string;

  productCategory: string;
  productSubCategory: string;

  price: number;
  discountPrice: number | null;

  quantity: number;
  unit: string;

  stock: number;
  trackInventory: boolean;

  mainImage: {
    url: string;
  };

  descriptionImages: {
    url: string;
  }[];

  variants: any[];
};

export default function GroceryDetailsPage() {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getSingleGrocery(slug);

        if (data.success) {
          setProduct(data.product);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return <div className="py-20 text-center">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="py-20 text-center text-red-500">Product not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery product={product} />
        <ProductInfo product={product} />
      </div>
    </div>
  );
}
