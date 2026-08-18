// components/groceries/product details/ProductInfo.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

import { addToCart } from "@/lib/cartApi";
import { isLoggedIn } from "@/lib/auth";

type ProductVariant = {
  label: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  isDefault: boolean;
};

type ProductInfoProps = {
  product: {
    _id: string;
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

    variants: ProductVariant[];
  };
};

export default function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * Find default variant.
   *
   * If there is a variant marked isDefault:true,
   * use its index.
   *
   * Otherwise use -1, meaning the base product.
   */
  const defaultVariantIndex = useMemo(() => {
    if (!product.variants?.length) {
      return -1;
    }

    const index = product.variants.findIndex(
      (variant) => variant.isDefault === true,
    );

    return index !== -1 ? index : -1;
  }, [product.variants]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(-1);

  useEffect(() => {
    setSelectedVariantIndex(defaultVariantIndex);
  }, [defaultVariantIndex]);

  /*
   * Get currently selected variant.
   */
  const selectedVariant =
    selectedVariantIndex >= 0 ? product.variants?.[selectedVariantIndex] : null;

  /*
   * Dynamic price.
   *
   * If a variant is selected, use variant price.
   * Otherwise use product-level price.
   */
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;

  const currentDiscountPrice = selectedVariant
    ? selectedVariant.discountPrice
    : product.discountPrice;

  /*
   * Dynamic label/quantity.
   *
   * Variant label is preferred when a variant is selected.
   */
  const currentQuantityLabel = selectedVariant
    ? selectedVariant.label
    : `${product.quantity} ${product.unit}`;

  /*
   * Discount calculation.
   */
  const hasDiscount =
    currentDiscountPrice !== null && currentDiscountPrice < currentPrice;

  const discountPercentage = hasDiscount
    ? Math.round(((currentPrice - currentDiscountPrice!) / currentPrice) * 100)
    : 0;

  // ======================================================
  // Variant Selection
  // ======================================================

  const handleVariantSelect = (index: number) => {
    setSelectedVariantIndex(index);

    setMessage("");
  };

  // ======================================================
  // Add To Cart
  // ======================================================

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const data = await addToCart(product._id, 1, selectedVariantIndex);

      if (data.success) {
        setMessage("Added to cart");

        window.dispatchEvent(new Event("cart-updated"));

        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to add to cart");
      }
    } catch (error: any) {
      console.error("Product Details Add To Cart Error:", error);

      setMessage(error?.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  // ======================================================
  // Buy Now
  // ======================================================

  const handleBuyNow = () => {
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
        variantIndex: String(selectedVariantIndex),
      });

      router.push(`/groceries/checkout?${params.toString()}`);
    } catch (error) {
      console.error("Product Details Buy Now Error:", error);

      setBuying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Product Name */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
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

          <span className="font-medium">{currentQuantityLabel}</span>
        </div>
      </div>

      {/* Variants */}
      {product.variants?.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold">Select Quantity</h2>

          <div className="flex flex-wrap gap-3">
            {product.variants.map((variant, index) => {
              const isSelected = selectedVariantIndex === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleVariantSelect(index)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-green-500 hover:bg-green-50"
                  }`}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-green-600">
            ₹{hasDiscount ? currentDiscountPrice : currentPrice}
          </span>

          {hasDiscount && (
            <>
              <span className="pb-1 text-lg text-gray-400 line-through">
                ₹{currentPrice}
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
        {/* Buy Now */}
        <button
          type="button"
          disabled={adding || buying}
          onClick={handleBuyNow}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-green-600 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingBag size={20} />

          {buying ? "Loading..." : "Buy Now"}
        </button>

        {/* Add to Cart */}
        <button
          type="button"
          disabled={adding || buying}
          onClick={handleAddToCart}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-green-600 font-semibold text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCart size={20} />

          {adding ? "Adding..." : "Add to Cart"}
        </button>
      </div>

      {/* Cart Message */}
      {message && (
        <p className="text-center text-sm font-medium text-green-600">
          {message}
        </p>
      )}

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
