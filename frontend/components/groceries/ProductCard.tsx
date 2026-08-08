"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ShoppingCart } from "lucide-react";

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
  const hasDiscount =
    product.discountPrice !== null && product.discountPrice < product.price;

  const discount = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100,
      )
    : 0;

  return (
    <Link href={`/groceries/${product.slug}`} className="group">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Image */}
        <div className="relative h-30 overflow-hidden bg-gray-100 md:h-40">
          <Image
            src={product.mainImage?.url || "https://placehold.co/600x600/png"}
            alt={product.productName}
            fill
            loading="eager"
            sizes="(max-width: 640px) 50vw,
                   (max-width: 768px) 33vw,
                   (max-width: 1024px) 25vw,
                   16vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />

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
          <div className="flex justify-between">
            <p className="text-xs text-gray-500">
              {product.quantity} {product.unit}
            </p>

            <div>
              {product.productSubCategory == "closed-products"
                ? "packet"
                : "open"}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-end gap-2">
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
          <div className="pt-1 sm:grid sm:grid-cols-2 sm:gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="hidden h-7 items-center justify-center gap-1 rounded-lg bg-green-600 text-sx font-medium text-white transition hover:bg-green-700 md:h-9 md:text-sm sm:flex"
            >
              <ShoppingBag size={16} />
              Buy
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-green-600 text-sm font-medium text-green-600 transition hover:bg-green-50"
            >
              <ShoppingCart size={16} />
              Cart
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
