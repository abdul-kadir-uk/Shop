// components/mobiles/product listing/MobileProductCard.tsx

"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { addToMobileCart } from "@/lib/mobileCartApi";
import { isLoggedIn } from "@/lib/auth";
import { useRouter } from "next/navigation";

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

type MobileProductCardProps = {
  product: MobileProduct;
};

export default function MobileProductCard({ product }: MobileProductCardProps) {
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  const hasDiscount =
    product.discountPrice !== null &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const discount = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100,
      )
    : 0;

  /*
   * If this product has available colors, the customer must
   * select a color before adding it to the cart.
   */
  const hasAvailableColors =
    product.colors?.some((color) => color.isAvailable) ?? false;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    /*
     * A product with color options must be opened first so
     * the customer can select the required color.
     */
    if (hasAvailableColors) {
      router.push(`/mobiles/${product.slug}`);
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      // Product has no color selection, so the existing
      // direct add-to-cart behavior remains unchanged.
      const data = await addToMobileCart(product._id, 1);

      if (data.success) {
        setMessage("Added to cart");

        // Update mobile navbar cart count
        window.dispatchEvent(new Event("mobile-cart-updated"));

        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to add to cart");

        setTimeout(() => {
          setMessage("");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Add To Mobile Cart Error:", error);

      setMessage(error?.response?.data?.message || "Failed to add to cart");

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link href={`/mobiles/${product.slug}`} className="group block min-w-0">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.mainImage?.url || "https://placehold.co/600x600/png"}
            alt={product.productName}
            loading="eager"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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

          {/* RAM + Storage */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>{product.ram}</span>
            <span>•</span>
            <span>{product.storage}</span>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-end gap-2">
            <span className="text-lg font-bold text-blue-600 md:text-xl">
              ₹{hasDiscount ? product.discountPrice : product.price}
            </span>

            {hasDiscount && (
              <span className="pb-1 text-sm text-gray-400 line-through">
                ₹{product.price}
              </span>
            )}
          </div>

          {/* Add To Cart */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={adding || !product.isAvailable}
              onClick={handleAddToCart}
              className="
                flex
                h-9
                w-full
                items-center
                justify-center
                gap-1
                rounded-lg
                border
                border-blue-600
                text-sm
                font-medium
                text-blue-600
                transition
                hover:bg-blue-50
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <ShoppingCart size={16} />

              <span>
                {!product.isAvailable
                  ? "Unavailable"
                  : adding
                    ? "Adding..."
                    : hasAvailableColors
                      ? "Select Color"
                      : "Add to Cart"}
              </span>
            </button>

            {message && (
              <p className="text-center text-xs font-medium text-blue-600">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
