// components/mobiles/product details/ProductInfo.tsx
"use client";

import { useMemo, useState } from "react";
import { ShoppingBag, ShoppingCart, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { isLoggedIn } from "@/lib/auth";
import { addToMobileCart } from "@/lib/mobileCartApi";

type ProductImage = {
  url: string;
  key?: string;
};

type MobileColor = {
  name: string;
  isAvailable: boolean;
  price: number | null;
  descriptionImages?: ProductImage[];
};

type MobileVariant = {
  _id: string;
  slug: string;
  productName: string;
  variantName?: string;
  ram: string;
  storage: string;
  price: number;
  discountPrice: number | null;
};

type MobileProduct = {
  _id: string;
  slug?: string;

  productName: string;
  brand: string;

  description: string;

  variantGroupId?: string | null;
  variantName?: string;

  ram: string;
  storage: string;

  processor: string;
  display: string;

  simCardSlots: string;
  connectorType: string;
  batteryCapacity: string;
  weight: string;
  displayType: string;
  screenSize: string;
  networkSupport: string;
  insideBox: string;

  colors: MobileColor[];

  camera: {
    front: string;
    rear: string;
  };

  operatingSystem: string;
  warranty: string;
  charging: string;

  mainImage: ProductImage;
  descriptionImages?: ProductImage[];

  variants?: MobileVariant[];

  price: number;
  discountPrice: number | null;

  isAvailable: boolean;
  totalSold?: number;
};

type ProductInfoProps = {
  product: MobileProduct;
  selectedColorIndex: number;
  onColorChange: (index: number) => void;
};

export default function ProductInfo({
  product,
  selectedColorIndex,
  onColorChange,
}: ProductInfoProps) {
  const router = useRouter();

  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const [adding, setAdding] = useState(false);

  const [buying, setBuying] = useState(false);

  const [message, setMessage] = useState("");

  // ==========================================================
  // SELECTED COLOR
  // ==========================================================

  const selectedColor =
    selectedColorIndex >= 0 ? product.colors?.[selectedColorIndex] : null;

  // ==========================================================
  // HAS COLOR PRICE
  // ==========================================================

  const hasColorPrice =
    selectedColor?.price !== null &&
    selectedColor?.price !== undefined &&
    Number(selectedColor.price) > 0;

  // ==========================================================
  // ORIGINAL PRODUCT PRICE
  // ==========================================================

  const originalPrice = useMemo(() => {
    return Number(product.price);
  }, [product.price]);

  // ==========================================================
  // CURRENT COLOR PRICE
  // ==========================================================

  const currentPrice = useMemo(() => {
    if (hasColorPrice) {
      return Number(selectedColor?.price);
    }

    return originalPrice;
  }, [hasColorPrice, selectedColor?.price, originalPrice]);

  // ==========================================================
  // CURRENT DISCOUNT
  // ==========================================================

  const currentDiscountPrice = useMemo(() => {
    if (hasColorPrice && currentPrice < originalPrice) {
      return currentPrice;
    }

    if (
      !hasColorPrice &&
      product.discountPrice !== null &&
      product.discountPrice !== undefined &&
      Number(product.discountPrice) > 0 &&
      Number(product.discountPrice) < originalPrice
    ) {
      return Number(product.discountPrice);
    }

    return null;
  }, [hasColorPrice, currentPrice, originalPrice, product.discountPrice]);

  // ==========================================================
  // SELLING PRICE
  // ==========================================================

  const sellingPrice = hasColorPrice
    ? currentPrice
    : (currentDiscountPrice ?? originalPrice);

  // ==========================================================
  // TOTAL PRICE
  // ==========================================================

  const totalPrice = sellingPrice * selectedQuantity;

  // ==========================================================
  // DISCOUNT PERCENTAGE
  // ==========================================================

  const discountPercentage =
    currentDiscountPrice !== null && originalPrice > 0
      ? Math.round(
          ((originalPrice - currentDiscountPrice) / originalPrice) * 100,
        )
      : 0;

  // ==========================================================
  // COLOR SELECT
  // ==========================================================

  const handleColorSelect = (index: number) => {
    const color = product.colors[index];

    if (!color?.isAvailable) {
      return;
    }

    // Selected color is now controlled by the parent page.
    onColorChange(index);

    setSelectedQuantity(1);
    setMessage("");
  };

  // ==========================================================
  // DECREASE QUANTITY
  // ==========================================================

  const handleDecrease = () => {
    if (selectedQuantity <= 1) {
      return;
    }

    setSelectedQuantity((current) => current - 1);
    setMessage("");
  };

  // ==========================================================
  // INCREASE QUANTITY
  // ==========================================================

  const handleIncrease = () => {
    setSelectedQuantity((current) => current + 1);
    setMessage("");
  };

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    if (!product.isAvailable) {
      setMessage("This mobile is currently unavailable.");
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const data = await addToMobileCart(
        product._id,
        selectedQuantity,
        selectedColor?.name || "",
      );

      if (data.success) {
        setMessage("Added to cart");

        window.dispatchEvent(new Event("mobile-cart-updated"));

        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to add mobile to cart");
      }
    } catch (error: any) {
      console.error("Mobile Product Add To Cart Error:", error);

      setMessage(
        error?.response?.data?.message || "Failed to add mobile to cart",
      );
    } finally {
      setAdding(false);
    }
  };

  // ==========================================================
  // BUY NOW
  // ==========================================================

  const handleBuyNow = () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    if (!product.isAvailable) {
      setMessage("This mobile is currently unavailable.");
      return;
    }

    try {
      setBuying(true);
      setMessage("");

      const params = new URLSearchParams({
        type: "buyNow",
        productId: product._id,
        quantity: String(selectedQuantity),
      });

      // Pass selected color to Buy Now checkout.
      if (selectedColor?.name) {
        params.set("color", selectedColor.name);
      }

      router.push(`/mobiles/checkout?${params.toString()}`);
    } catch (error) {
      console.error("Mobile Product Buy Now Error:", error);

      setBuying(false);
      setMessage("Unable to continue");
    }
  };

  return (
    <div className="space-y-5">
      {/* ====================================================
          PRODUCT NAME
      ==================================================== */}

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

        {product.variantName && (
          <p className="mt-1 text-sm text-gray-500">
            Variant :
            <span className="ml-1 font-medium text-gray-700">
              {product.variantName}
            </span>
          </p>
        )}

        {/* ==================================================
            AVAILABLE VARIANTS
        ================================================== */}

        {product.variants && product.variants.length > 1 && (
          <div className="mt-4 rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Available Variants
            </h2>

            <div className="flex flex-wrap gap-3">
              {product.variants.map((variant) => {
                const isCurrentVariant = variant._id === product._id;

                return (
                  <Link
                    key={variant._id}
                    href={`/mobiles/${variant.slug}`}
                    className={`rounded-lg border px-4 py-3 transition ${
                      isCurrentVariant
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {variant.ram} / {variant.storage}
                    </div>

                    {variant.variantName && (
                      <div
                        className={`mt-1 text-xs ${
                          isCurrentVariant ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {variant.variantName}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================
          COLORS
      ==================================================== */}

      {product.colors?.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Select Color</h2>

            {selectedColor && (
              <span className="text-sm text-gray-500">
                {selectedColor.name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {product.colors.map((color, index) => {
              const isSelected = selectedColorIndex === index;

              const isUnavailable = !color.isAvailable;

              return (
                <button
                  key={`${color.name}-${index}`}
                  type="button"
                  disabled={isUnavailable || adding || buying}
                  onClick={() => handleColorSelect(index)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isUnavailable
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  {color.name}

                  {isUnavailable && (
                    <span className="ml-1 text-xs">(Unavailable)</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedColor?.price !== null &&
            selectedColor?.price !== undefined && (
              <p className="mt-3 text-xs text-gray-500">
                This color has a different price.
              </p>
            )}
        </div>
      )}

      {/* ====================================================
          QUANTITY
      ==================================================== */}

      <div className="rounded-xl border bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Quantity</h2>

            <p className="mt-1 text-sm text-gray-500">
              {selectedColor
                ? `${selectedColor.name} color`
                : "Selected mobile"}
            </p>
          </div>

          <div className="flex w-fit items-center overflow-hidden rounded-lg border border-gray-300">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={selectedQuantity <= 1 || adding || buying}
              className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={18} />
            </button>

            <div className="flex min-w-16 items-center justify-center border-x border-gray-300 px-3">
              <span className="font-semibold text-gray-900">
                {selectedQuantity}
              </span>
            </div>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={adding || buying}
              className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================
          PRICE
      ==================================================== */}

      <div className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-3xl font-bold text-blue-600">
            ₹{totalPrice.toLocaleString("en-IN")}
          </span>

          {currentDiscountPrice !== null && (
            <>
              <span className="pb-1 text-lg text-gray-400 line-through">
                ₹{(originalPrice * selectedQuantity).toLocaleString("en-IN")}
              </span>

              <span className="rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-600">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>

        <p className="mt-2 text-sm text-gray-500">
          ₹{sellingPrice.toLocaleString("en-IN")} per mobile
        </p>

        {selectedQuantity > 1 && (
          <p className="mt-1 text-sm text-gray-500">
            {selectedQuantity} × ₹{sellingPrice.toLocaleString("en-IN")}
          </p>
        )}

        {selectedColor?.price !== null &&
          selectedColor?.price !== undefined && (
            <p className="mt-2 text-xs text-gray-500">
              Color price: ₹{selectedColor.price.toLocaleString("en-IN")}
            </p>
          )}
      </div>

      {/* ====================================================
          BUTTONS
      ==================================================== */}

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={adding || buying || !product.isAvailable}
          onClick={handleBuyNow}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingBag size={20} />

          {buying ? "Loading..." : "Buy Now"}
        </button>

        <button
          type="button"
          disabled={adding || buying || !product.isAvailable}
          onClick={handleAddToCart}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-blue-600 font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCart size={20} />

          {adding ? "Adding..." : "Add to Cart"}
        </button>
      </div>

      {/* ====================================================
          MESSAGE
      ==================================================== */}

      {message && (
        <p className="text-center text-sm font-medium text-blue-600">
          {message}
        </p>
      )}

      {/* ====================================================
          DESCRIPTION
      ==================================================== */}

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Product Description</h2>

        <p className="whitespace-pre-line leading-7 text-gray-700">
          {product.description || "No description available."}
        </p>
      </div>

      {/* ====================================================
          MOBILE SPECIFICATIONS
      ==================================================== */}

      <div className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Specifications</h2>

        {product.ram && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">RAM</span>
            <span className="font-medium">{product.ram}</span>
          </div>
        )}

        {product.storage && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Storage</span>
            <span className="font-medium">{product.storage}</span>
          </div>
        )}

        {product.processor && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Processor</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.processor}
            </span>
          </div>
        )}

        {product.display && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Display</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.display}
            </span>
          </div>
        )}

        {product.displayType && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Display Type</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.displayType}
            </span>
          </div>
        )}

        {product.screenSize && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Screen Size</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.screenSize}
            </span>
          </div>
        )}

        {product.networkSupport && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Network Support</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.networkSupport}
            </span>
          </div>
        )}

        {product.simCardSlots && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">SIM Card Slots</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.simCardSlots}
            </span>
          </div>
        )}

        {product.connectorType && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Connector Type</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.connectorType}
            </span>
          </div>
        )}

        {product.batteryCapacity && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Battery Capacity</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.batteryCapacity}
            </span>
          </div>
        )}

        {product.weight && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Weight</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.weight}
            </span>
          </div>
        )}

        {product.camera?.front && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Front Camera</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.camera.front}
            </span>
          </div>
        )}

        {product.camera?.rear && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Rear Camera</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.camera.rear}
            </span>
          </div>
        )}

        {product.operatingSystem && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Operating System</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.operatingSystem}
            </span>
          </div>
        )}

        {product.charging && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Charging</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.charging}
            </span>
          </div>
        )}

        {product.warranty && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Warranty</span>
            <span className="max-w-[60%] text-right font-medium">
              {product.warranty}
            </span>
          </div>
        )}

        {product.insideBox && (
          <div className="flex justify-between">
            <span className="text-gray-500">Inside the Box</span>
            <span className="max-w-[60%] whitespace-pre-line text-right font-medium">
              {product.insideBox}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
