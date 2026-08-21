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

const PRODUCTS_PER_PAGE = 12;

export default function ProductGrid({ filters, search }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(1);

  // Determines whether there are more products available
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (pageNumber: number, loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params: any = {
        page: pageNumber,
        limit: PRODUCTS_PER_PAGE,
      };

      if (search) {
        params.search = search;
      }

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
        const newProducts: Product[] = data.products || [];

        if (loadMore) {
          setProducts((previousProducts) => [
            ...previousProducts,
            ...newProducts,
          ]);
        } else {
          setProducts(newProducts);
        }

        /*
         * If the API returns fewer products than the requested limit,
         * we know there are no more products to load.
         */
        setHasMore(newProducts.length === PRODUCTS_PER_PAGE);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  /*
   * Fetch the first page whenever filters or search changes.
   */
  useEffect(() => {
    setPage(1);
    setHasMore(true);

    fetchProducts(1, false);
  }, [filters, search]);

  /*
   * Load the next page.
   */
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;

    await fetchProducts(nextPage, true);

    setPage(nextPage);
  };

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
        <>
          {/* Product Grid */}
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

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 flex justify-center pb-6">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="
                  rounded-lg
                  bg-black
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-gray-800
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loadingMore ? "Loading products..." : "Load More Products"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
