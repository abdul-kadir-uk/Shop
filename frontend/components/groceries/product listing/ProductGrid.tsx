// components/groceries/ProductGrid.tsx
"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { getAllGroceries } from "@/lib/groceryApi";

type Filters = {
  category: string;
  subCategory: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

type ProductGridProps = {
  filters: Filters;
  search: string;
};

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

export default function ProductGrid({ filters, search }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: 1,
        limit: 12,
      };

      if (search) params.search = search;

      if (filters.category) {
        params.category = filters.category;
      }

      if (filters.subCategory) {
        params.subCategory = filters.subCategory;
      }

      if (filters.minPrice) {
        params.minPrice = filters.minPrice;
      }

      if (filters.maxPrice) {
        params.maxPrice = filters.maxPrice;
      }

      if (filters.sort) {
        params.sort = filters.sort;
      }

      const data = await getAllGroceries(params);

      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, search]);

  return (
    <section className="w-full min-w-0">
      {/* Heading */}
      <h1 className="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl">
        Grocery Products
      </h1>

      {/* Loading */}
      {loading ? (
        <div className="py-10 text-center">Loading products...</div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="py-10 text-center text-gray-500">
          No products found.
        </div>
      ) : (
        /* Product Grid */
        <div
          className="
            grid
            w-full
            min-w-0
            grid-cols-1
            gap-3
            min-[400px]:grid-cols-2
            sm:gap-4
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            xl:grid-cols-6
          "
        >
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
