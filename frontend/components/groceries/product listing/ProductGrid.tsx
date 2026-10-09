"use client";

import { useEffect, useRef, useState } from "react";
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

  // Element observed by IntersectionObserver
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
         * there are no more products to load.
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
   * Automatically load the next page when the user
   * gets near the bottom of the product list.
   */
  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasMore || loading || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (!firstEntry.isIntersecting) {
          return;
        }

        if (loadingMore || !hasMore) {
          return;
        }

        const nextPage = page + 1;

        setPage(nextPage);
        fetchProducts(nextPage, true);
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [page, hasMore, loading, loadingMore, filters, search]);

  return (
    <section className="w-full min-w-0">
      {/* Heading */}
      <h1 className="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl">
        {filters.category || "Grocery Products"}
      </h1>

      {/* Initial Loading */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div
            className="
              h-8
              w-8
              animate-spin
              rounded-full
              border-4
              border-gray-200
              border-t-black
            "
          />
        </div>
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

          {/* Infinite Scroll Loader */}
          {hasMore && (
            <div
              ref={loadMoreRef}
              className="flex min-h-24 items-center justify-center py-8"
            >
              {loadingMore && (
                <div
                  className="
                    h-8
                    w-8
                    animate-spin
                    rounded-full
                    border-4
                    border-gray-200
                    border-t-black
                  "
                />
              )}
            </div>
          )}

          {/* End of Products */}
          {!hasMore && products.length > 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              No more products
            </div>
          )}
        </>
      )}
    </section>
  );
}
