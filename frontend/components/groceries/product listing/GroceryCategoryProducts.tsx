// components/groceries/product listing/GroceryCategoryProducts.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/groceries/product listing/ProductCard";
import { getAllGroceries } from "@/lib/groceryApi";

type Product = {
  _id: string;
  slug: string;
  productName: string;
  brand: string;
  productCategory: string;
  productSubCategory: string;
  mainImage: {
    url: string;
  };
  price: number;
  discountPrice: number | null;
  quantity: number;
  unit: string;
  averageRating: number;
  totalRatings: number;
  totalSold: number;
};

const categories = [
  "Rice and Grains",
  "flour and staples",
  "Pulses",
  "Spices",
  "Oil",
  "Dry Fruits",
  "Tea, Coffee and Beverages",
  "Sugar, Salt and Pickles",
  "Personal & Household Care",
  "Dairy Products",
];

const PRODUCTS_PER_CATEGORY = 4;

export default function GroceryCategoryProducts() {
  const router = useRouter();

  const [categoryProducts, setCategoryProducts] = useState<
    Record<string, Product[]>
  >({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);

        const results = await Promise.all(
          categories.map(async (category) => {
            try {
              const data = await getAllGroceries({
                page: 1,
                limit: PRODUCTS_PER_CATEGORY,
                category,
                sort: "latest",
              });

              return {
                category,
                products: data.success ? data.products || [] : [],
              };
            } catch (error) {
              console.error(`Failed to fetch products for ${category}`, error);

              return {
                category,
                products: [],
              };
            }
          }),
        );

        if (cancelled) {
          return;
        }

        const groupedProducts: Record<string, Product[]> = {};

        results.forEach(({ category, products }) => {
          groupedProducts[category] = products;
        });

        setCategoryProducts(groupedProducts);
      } catch (error) {
        console.error("Failed to fetch category products", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategoryProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSeeAll = (category: string) => {
    router.push(`/groceries?category=${encodeURIComponent(category)}`);
  };

  if (loading) {
    return (
      <section className="space-y-6">
        {categories.slice(0, 4).map((category) => (
          <div key={category}>
            <div className="mb-3 flex items-center justify-between">
              <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-3/4 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {categories.map((category) => {
        const products = categoryProducts[category] || [];

        if (products.length === 0) {
          return null;
        }

        return (
          <div key={category} className="min-w-0">
            {/* Category Header */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                {category}
              </h2>

              <button
                type="button"
                onClick={() => handleSeeAll(category)}
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-green-600 cursor-pointer transition hover:text-green-700"
              >
                See All
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Products */}
            <div
              className="
    flex
    w-full
    min-w-0
    gap-3
    overflow-x-auto
    pb-2
    sm:gap-4
    md:grid
    md:grid-cols-6
    md:overflow-visible
    md:pb-0
  "
            >
              {products.map((product) => (
                <div
                  key={product._id}
                  className="
        w-[48%]
        min-w-[48%]
        shrink-0
        sm:w-[28%]
        sm:min-w-[28%]
        md:w-auto
        md:min-w-0
      "
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
