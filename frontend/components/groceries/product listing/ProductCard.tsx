// components/groceries/ProductCard.tsx

"use client";

import Link from "next/link";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { addToCart } from "@/lib/cartApi";
import { isLoggedIn } from "@/lib/auth";
import { useRouter } from "next/navigation";

type ProductCardProps = {
  product: {
    _id: string;
    slug: string;
    productName: string;
    brand: string;
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
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");

  const hasDiscount =
    product.discountPrice !== null && product.discountPrice < product.price;

  const discount = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100,
      )
    : 0;

  // ======================================================
  // Add To Cart
  // ======================================================

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check login
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const data = await addToCart(product._id, 1, -1);

      if (data.success) {
        setMessage("Added to cart");

        // Tell navbar to refresh cart count
        window.dispatchEvent(new Event("cart-updated"));

        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to add to cart");
      }
    } catch (error: any) {
      console.error("Add To Cart Error:", error);

      setMessage(error?.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  // ======================================================
  // Buy Now
  // ======================================================

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check login
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    try {
      setBuying(true);

      const params = new URLSearchParams({
        type: "buyNow",
        productId: product._id,
        quantity: "1",
        variantIndex: "-1",
      });

      router.push(`/groceries/checkout?${params.toString()}`);
    } catch (error) {
      console.error("Buy Now Error:", error);
      setBuying(false);
    }
  };

  return (
    <Link href={`/groceries/${product.slug}`} className="group block min-w-0">
      {/* Card */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.mainImage?.url || "https://placehold.co/600x600/png"}
            alt={product.productName}
            loading="eager"
            sizes="
              (max-width: 399px) 100vw,
              (max-width: 640px) 50vw,
              (max-width: 768px) 33vw,
              (max-width: 1024px) 25vw,
              (max-width: 1280px) 20vw,
              16vw
            "
            className="object-cover transition duration-500 group-hover:scale-105"
          />

          {/* Discount */}
          {hasDiscount && (
            <span className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-[11px] font-semibold text-white shadow">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1 p-2 md:space-y-2 md:p-3">
          {/* Brand */}
          <p className="truncate text-xs font-medium text-gray-500">
            {product.brand || "-"}
          </p>

          {/* Product Name */}
          <h3 className="line-clamp-2 min-h-8 text-sm font-semibold leading-5 text-gray-900 md:text-base">
            {product.productName}
          </h3>

          {/* Quantity */}
          <div className="flex justify-between gap-2">
            <p className="text-xs text-gray-500">
              {product.quantity} {product.unit}
            </p>

            <p className="text-xs text-gray-700">
              {product.productSubCategory === "closed-products"
                ? "packet"
                : "open"}
            </p>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-end gap-2">
            <span className="text-lg font-bold text-green-600 md:text-2xl">
              ₹{hasDiscount ? product.discountPrice : product.price}
            </span>

            {hasDiscount && (
              <span className="pb-1 text-sm text-gray-400 line-through">
                ₹{product.price}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Add to Cart */}
            <button
              type="button"
              disabled={adding || buying}
              onClick={handleAddToCart}
              className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-green-600 text-sm font-medium text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart size={16} />

              <span>{adding ? "Adding..." : "Add to Cart"}</span>
            </button>

            {/* Success / Error Message */}
            {message && (
              <p className="text-center text-xs font-medium text-green-600">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
