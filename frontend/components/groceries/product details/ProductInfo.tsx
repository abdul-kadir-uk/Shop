// components/groceries/product details/ProductInfo.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingBag, ShoppingCart, Minus, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { calculateGroceryProductPrice } from "@/lib/groceryApi";

import { addToCart } from "@/lib/cartApi";
import { isLoggedIn } from "@/lib/auth";

type ProductVariant = {
  quantity: number;
  unit: string;
  label: string;
  price: number;
  discountPrice: number | null;
  isDefault: boolean;
};

type ProductInfoProps = {
  product: {
    _id: string;
    slug?: string;

    productName: string;
    description: string;

    brand: string;

    productCategory: string;
    productSubCategory: string;

    quantity: number;
    unit: string;

    price: number;
    discountPrice: number | null;

    variants: ProductVariant[];
  };
};

type BackendPricing = {
  quantity: number;
  baseQuantity: number;
  unit: string;
  label: string;

  price: number;
  discountPrice: number | null;
  sellingPrice: number;
  subtotal: number;
  discount: number;
};

export default function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(-1);

  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const [pricing, setPricing] = useState<BackendPricing | null>(null);

  const [pricingLoading, setPricingLoading] = useState(false);

  const [pricingError, setPricingError] = useState("");

  const requestIdRef = useRef(0);

  // ======================================================
  // Minimum Order Value
  // ======================================================

  const MINIMUM_ORDER_VALUE = 100;

  // ======================================================
  // Default Variant
  // ======================================================

  const defaultVariantIndex = useMemo(() => {
    if (!product.variants?.length) {
      return -1;
    }

    const index = product.variants.findIndex(
      (variant) => variant.isDefault === true,
    );

    return index !== -1 ? index : -1;
  }, [product.variants]);

  // ======================================================
  // Selected Variant
  // ======================================================

  const selectedVariant =
    selectedVariantIndex >= 0 ? product.variants?.[selectedVariantIndex] : null;

  // ======================================================
  // Set Default Variant
  // ======================================================

  useEffect(() => {
    setSelectedVariantIndex(defaultVariantIndex);
  }, [defaultVariantIndex]);

  // ======================================================
  // Reset Quantity When Variant Changes
  // ======================================================

  useEffect(() => {
    setSelectedQuantity(1);
    setPricing(null);
    setPricingError("");
  }, [selectedVariantIndex]);

  // ======================================================
  // Fetch Backend Pricing
  // ======================================================

  useEffect(() => {
    if (!slug) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const fetchPricing = async () => {
      try {
        setPricingLoading(true);
        setPricingError("");

        const data = await calculateGroceryProductPrice(
          slug,
          selectedQuantity,
          selectedVariantIndex,
        );

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (!data.success) {
          setPricingError(data.message || "Failed to calculate price.");

          setPricing(null);
          return;
        }

        setPricing(data.data);
      } catch (error: any) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        console.error("Product Price Calculation Error:", error);

        setPricing(null);

        setPricingError(
          error?.response?.data?.message ||
            "Unable to calculate product price.",
        );
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setPricingLoading(false);
        }
      }
    };

    fetchPricing();
  }, [slug, selectedQuantity, selectedVariantIndex]);

  // ======================================================
  // Current Unit Information
  // ======================================================

  const currentBaseQuantity = selectedVariant?.quantity ?? product.quantity;

  const currentUnit = selectedVariant?.unit ?? product.unit;

  const currentLabel =
    selectedVariant?.label || `${currentBaseQuantity} ${currentUnit}`;

  // ======================================================
  // Discount Percentage
  // ======================================================

  const discountPercentage =
    pricing &&
    pricing.discountPrice !== null &&
    pricing.price > 0 &&
    pricing.discountPrice < pricing.price
      ? Math.round(
          ((pricing.price - pricing.discountPrice) / pricing.price) * 100,
        )
      : 0;

  const hasDiscount =
    pricing !== null &&
    pricing.discountPrice !== null &&
    pricing.discountPrice < pricing.price;

  // ======================================================
  // Minimum Order Check
  //
  // pricing.subtotal is already the actual discounted
  // payable product value.
  // ======================================================

  const minimumOrderNotReached =
    !pricing || pricing.subtotal < MINIMUM_ORDER_VALUE;

  const buyNowDisabled =
    adding || buying || pricingLoading || !pricing || minimumOrderNotReached;

  // ======================================================
  // Quantity Controls
  // ======================================================

  const handleDecrease = () => {
    if (selectedQuantity <= 1) {
      return;
    }

    setSelectedQuantity((current) => current - 1);
    setMessage("");
  };

  const handleIncrease = () => {
    setSelectedQuantity((current) => current + 1);
    setMessage("");
  };

  // ======================================================
  // Variant Selection
  // ======================================================

  const handleVariantSelect = (index: number) => {
    setSelectedVariantIndex(index);
    setSelectedQuantity(1);
    setMessage("");
    setPricingError("");
  };

  // ======================================================
  // Add To Cart
  // ======================================================

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    if (!pricing) {
      setMessage(pricingError || "Please wait for the product price to load.");
      return;
    }

    if (pricingLoading) {
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const data = await addToCart(
        product._id,
        selectedQuantity,
        selectedVariantIndex,
      );

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

    if (!pricing) {
      setMessage(pricingError || "Please wait for the product price to load.");
      return;
    }

    if (pricingLoading) {
      return;
    }

    // --------------------------------------------------
    // Minimum Order Value
    // --------------------------------------------------

    if (pricing.subtotal < MINIMUM_ORDER_VALUE) {
      setMessage(`Minimum order value is ₹${MINIMUM_ORDER_VALUE}.`);
      return;
    }

    try {
      setBuying(true);

      const params = new URLSearchParams({
        type: "buyNow",
        productId: product._id,
        quantity: String(selectedQuantity),
        variantIndex: String(selectedVariantIndex),
      });

      router.push(`/groceries/checkout?${params.toString()}`);
    } catch (error) {
      console.error("Product Details Buy Now Error:", error);

      setBuying(false);
    }
  };

  // ======================================================
  // Render
  // ======================================================

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
          <span className="text-gray-500">Unit</span>

          <span className="font-medium">{currentLabel}</span>
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
                  {variant.label || `${variant.quantity} ${variant.unit}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}

      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Quantity</h2>

            <p className="mt-1 text-sm text-gray-500">
              {currentLabel} per unit
            </p>
          </div>

          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
            {/* Decrease */}

            <button
              type="button"
              onClick={handleDecrease}
              disabled={
                selectedQuantity <= 1 || pricingLoading || adding || buying
              }
              className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={18} />
            </button>

            {/* Current Quantity */}

            <div className="flex min-w-28 items-center justify-center border-x border-gray-300 px-3">
              <span className="font-semibold text-gray-900">
                {selectedQuantity} × {currentLabel}
              </span>
            </div>

            {/* Increase */}

            <button
              type="button"
              onClick={handleIncrease}
              disabled={pricingLoading || adding || buying}
              className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Price */}

      <div className="rounded-xl border bg-white p-5">
        {pricingLoading && !pricing ? (
          <div className="text-lg font-medium text-gray-500">
            Calculating price...
          </div>
        ) : pricing ? (
          <div>
            {/* Total Price */}

            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-green-600">
                ₹{pricing.subtotal}
              </span>

              {hasDiscount && (
                <>
                  <span className="pb-1 text-lg text-gray-400 line-through">
                    ₹{pricing.price * pricing.quantity}
                  </span>

                  <span className="rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-600">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Per Unit Price */}

            <p className="mt-2 text-sm text-gray-500">
              ₹{pricing.sellingPrice} per {pricing.label}
            </p>

            {/* Quantity Calculation */}

            {selectedQuantity > 1 && (
              <p className="mt-1 text-sm text-gray-500">
                {selectedQuantity} × {currentLabel}
              </p>
            )}

            {/* Minimum Order Message */}

            {pricing.subtotal < MINIMUM_ORDER_VALUE && (
              <p className="mt-2 text-xs font-medium text-red-500">
                Minimum order value for BuyNow is ₹{MINIMUM_ORDER_VALUE}.
                Increase quantity or add product to the cart.
              </p>
            )}
          </div>
        ) : (
          <div className="text-sm font-medium text-red-500">
            {pricingError || "Unable to calculate price."}
          </div>
        )}
      </div>

      {/* Buttons */}

      <div className="grid grid-cols-2 gap-4">
        {/* Buy Now */}

        <button
          type="button"
          disabled={buyNowDisabled}
          onClick={handleBuyNow}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-green-600 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingBag size={20} />

          {buying ? "Loading..." : "Buy Now"}
        </button>

        {/* Add To Cart */}

        <button
          type="button"
          disabled={adding || buying || pricingLoading || !pricing}
          onClick={handleAddToCart}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-green-600 font-semibold text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCart size={20} />

          {adding ? "Adding..." : "Add to Cart"}
        </button>
      </div>

      {/* Message */}

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
