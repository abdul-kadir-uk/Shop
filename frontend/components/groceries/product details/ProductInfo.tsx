"use client";

import { ShoppingBag, ShoppingCart } from "lucide-react";

type ProductInfoProps = {
  product: {
    productName: string;
    description: string;

    brand: string;

    productCategory: string;
    productSubCategory: string;

    quantity: number;
    unit: string;

    stock: number;
    trackInventory: boolean;

    price: number;
    discountPrice: number | null;
  };
};

export default function ProductInfo({ product }: ProductInfoProps) {
  const hasDiscount =
    product.discountPrice !== null && product.discountPrice < product.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-4xl">
          {product.productName}
        </h1>

        {product.brand && (
          <p className="mt-2 text-gray-500">
            Brand :
            <span className="ml-1 font-medium text-gray-700">
              {product.brand}
            </span>
          </p>
        )}
      </div>

      {/* Details */}
      <div className="space-y-3 rounded-xl border bg-white p-5">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">Category</span>
          <span className="font-medium">{product.productCategory}</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">Product Type</span>
          <span className="font-medium">
            {product.productSubCategory === "closed-products"
              ? "Packet"
              : "Open"}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">Quantity</span>
          <span className="font-medium">
            {product.quantity} {product.unit}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Availability</span>

          {product.trackInventory ? (
            product.stock > 0 ? (
              <span className="font-semibold text-green-600">
                In Stock ({product.stock})
              </span>
            ) : (
              <span className="font-semibold text-red-600">Out of Stock</span>
            )
          ) : (
            <span className="font-semibold text-green-600">Available</span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-green-600">
            ₹{hasDiscount ? product.discountPrice : product.price}
          </span>

          {hasDiscount && (
            <>
              <span className="pb-1 text-lg text-gray-400 line-through">
                ₹{product.price}
              </span>

              <span className="rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-600">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="flex h-12 items-center justify-center gap-2 rounded-lg bg-green-600 font-semibold text-white transition hover:bg-green-700">
          <ShoppingBag size={20} />
          Buy Now
        </button>

        <button className="flex h-12 items-center justify-center gap-2 rounded-lg border border-green-600 font-semibold text-green-600 transition hover:bg-green-50">
          <ShoppingCart size={20} />
          Add to Cart
        </button>
      </div>

      {/* Description */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Product Description</h2>

        <p className="whitespace-pre-line leading-7 text-gray-700">
          {product.description || "No description available."}
        </p>
      </div>
    </div>
  );
}
