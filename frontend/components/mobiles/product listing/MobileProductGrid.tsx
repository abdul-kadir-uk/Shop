// components/mobiles/product listing/MobileProductGrid.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileProductCard from "./MobileProductCard";
import api from "@/lib/api";
import { addToMobileCart } from "@/lib/mobileCartApi";
import { isLoggedIn } from "@/lib/auth";

type Filters = {
  brand: string;
  ram: string;
  storage: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

type MobileProductGridProps = {
  filters: Filters;
  search: string;
};

type MobileColor = {
  name: string;
  isAvailable: boolean;
  price: number | null;
};

type MobileProduct = {
  _id: string;
  slug: string;
  productName: string;
  brand: string;

  variantGroupId?: string | null;
  variantName?: string;

  mainImage: {
    url: string;
    key?: string;
  };

  price: number;
  discountPrice: number | null;

  ram: string;
  storage: string;

  colors?: MobileColor[];

  isAvailable: boolean;
  totalSold: number;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const PRODUCTS_PER_PAGE = 12;

export default function MobileProductGrid({
  filters,
  search,
}: MobileProductGridProps) {
  const router = useRouter();

  const [products, setProducts] = useState<MobileProduct[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Add to cart state
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState("");

  const fetchProducts = async (pageNumber: number, loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();

      params.set("page", String(pageNumber));
      params.set("limit", String(PRODUCTS_PER_PAGE));

      // Search
      if (search.trim()) {
        params.set("search", search.trim());
      }

      // Brand
      if (filters.brand) {
        params.set("brand", filters.brand);
      }

      // RAM
      if (filters.ram) {
        params.set("ram", filters.ram);
      }

      // Storage
      if (filters.storage) {
        params.set("storage", filters.storage);
      }

      /*
       * Backend sort values:
       *
       * newest
       * price-low
       * price-high
       * popular
       */
      switch (filters.sort) {
        case "price_low":
          params.set("sort", "price-low");
          break;

        case "price_high":
          params.set("sort", "price-high");
          break;

        case "latest":
          params.set("sort", "newest");
          break;

        case "oldest":
          /*
           * Current backend does not have a separate
           * oldest sort option.
           *
           * Leave it unset for now.
           */
          break;

        case "discount":
          /*
           * Current backend does not have a discount
           * sort option.
           */
          break;

        case "name_asc":
          /*
           * Current backend does not have name sorting.
           */
          break;

        case "name_desc":
          /*
           * Current backend does not have name sorting.
           */
          break;

        default:
          params.set("sort", "newest");
      }

      const response = await api.get(`/mobiles?${params.toString()}`);

      const data = response.data;

      const newProducts: MobileProduct[] = data.products || [];

      const pagination: Pagination | undefined = data.pagination;

      if (loadMore) {
        setProducts((previousProducts) => [
          ...previousProducts,
          ...newProducts,
        ]);
      } else {
        setProducts(newProducts);
      }

      if (pagination) {
        setHasMore(pagination.hasNextPage);
      } else {
        setHasMore(newProducts.length === PRODUCTS_PER_PAGE);
      }
    } catch (error) {
      console.error("Failed to fetch mobile products:", error);

      if (!loadMore) {
        setProducts([]);
      }

      setHasMore(false);
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  /*
   * Add mobile product to cart
   */
  const handleAddToCart = async (productId: string) => {
    // Customer must be logged in
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    try {
      setAddingProductId(productId);
      setCartMessage("");

      const data = await addToMobileCart(productId, 1);

      if (data.success) {
        setCartMessage("Added to cart");

        // Tell mobile navbar to refresh cart count
        window.dispatchEvent(new Event("mobile-cart-updated"));

        setTimeout(() => {
          setCartMessage("");
        }, 2000);
      } else {
        setCartMessage(data.message || "Failed to add to cart");

        setTimeout(() => {
          setCartMessage("");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Failed to add mobile product to cart:", error);

      setCartMessage(error?.response?.data?.message || "Failed to add to cart");

      setTimeout(() => {
        setCartMessage("");
      }, 2000);
    } finally {
      setAddingProductId(null);
    }
  };

  /*
   * Fetch again whenever search or filters change.
   */
  useEffect(() => {
    setPage(1);
    setHasMore(true);

    fetchProducts(1, false);
  }, [filters, search]);

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
        Mobile Phones
      </h1>

      {/* Cart Message */}
      {cartMessage && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {cartMessage}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-10 text-center text-gray-500">
          Loading mobiles...
        </div>
      ) : products.length === 0 ? (
        <div className="py-10 text-center text-gray-500">No mobiles found.</div>
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
              <MobileProductCard key={product._id} product={product} />
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
                  bg-blue-600
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loadingMore ? "Loading mobiles..." : "Load More Mobiles"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
