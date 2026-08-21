// app/groceries/checkout/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";

import { isLoggedIn } from "@/lib/auth";
import { getCheckoutSummary, placeOrder } from "@/lib/groceryOrderApi";

import CheckoutCustomer from "@/components/groceries/checkout/CheckoutCustomer";
import CheckoutAddress from "@/components/groceries/checkout/CheckoutAddress";
import CheckoutPayment from "@/components/groceries/checkout/CheckoutPayment";
import CheckoutSummary from "@/components/groceries/checkout/CheckoutSummary";

type Customer = {
  name: string;
  email: string;
  mobile: string;
  address?: string;
};

type City = {
  _id: string;
  name: string;
  state: string;
  deliveryCharge?: number;
};

type CheckoutItem = {
  product: string;
  productName: string;
  brand: string;
  image: string;
  quantity: number;
  variantIndex?: number;

  variant?: {
    quantity: number;
    unit: string;
    label: string;
  };

  price: number;
  discountPrice: number | null;
  sellingPrice: number;
  subtotal: number;
  discount: number;
};

type Pricing = {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
};

type CheckoutOrder = {
  items: CheckoutItem[];

  unavailableItems?: {
    product?: string;
    productName?: string;
    reason: string;
  }[];

  pricing: Pricing;
};

type CheckoutData = {
  type: "cart" | "buyNow";

  customer: Customer;

  cities: City[];

  order: CheckoutOrder;

  paymentMethods: {
    value: "COD";
    label: string;
  }[];
};

function GroceryCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CheckoutData | null>(null);

  const [selectedCity, setSelectedCity] = useState("");
  const [address, setAddress] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"COD">("COD");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [orderError, setOrderError] = useState("");

  // ======================================================
  // Load Checkout
  // ======================================================

  useEffect(() => {
    const loadCheckout = async () => {
      if (!isLoggedIn()) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        // --------------------------------------------------
        // Checkout Type
        // --------------------------------------------------

        const typeParam = searchParams.get("type");

        const type: "cart" | "buyNow" =
          typeParam === "buyNow" ? "buyNow" : "cart";

        // --------------------------------------------------
        // Buy Now Parameters
        // --------------------------------------------------

        const productId = searchParams.get("productId") || undefined;

        const quantityParam = searchParams.get("quantity");

        const quantity =
          quantityParam && Number(quantityParam) > 0
            ? Number(quantityParam)
            : 1;

        const variantIndexParam = searchParams.get("variantIndex");

        const variantIndex =
          variantIndexParam !== null ? Number(variantIndexParam) : -1;

        // --------------------------------------------------
        // Fetch Checkout Summary
        // --------------------------------------------------

        const response = await getCheckoutSummary({
          type,

          ...(type === "buyNow"
            ? {
                productId,
                variantIndex,
                quantity,
              }
            : {}),
        });

        if (!response.success) {
          setError(response.message || "Unable to load checkout.");
          return;
        }

        setData(response.data);

        // --------------------------------------------------
        // Use Saved Customer Address
        // --------------------------------------------------

        if (response.data.customer?.address) {
          setAddress(response.data.customer.address);
        }
      } catch (err: any) {
        console.error("Checkout Summary Error:", err);

        if (err?.response?.status === 401 || err?.response?.status === 403) {
          router.replace("/login");
          return;
        }

        setError(err?.response?.data?.message || "Failed to load checkout.");
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, [router, searchParams]);

  // ======================================================
  // Calculate Checkout Pricing
  // ======================================================

  const checkoutPricing = useMemo<Pricing | null>(() => {
    if (!data) {
      return null;
    }

    const selectedCityData = data.cities.find(
      (city) => city._id === selectedCity,
    );

    const deliveryCharge = selectedCityData?.deliveryCharge ?? 0;

    /*
     * IMPORTANT:
     *
     * data.order.pricing.subtotal is already calculated using
     * the selling price.
     *
     * If a product has a discount:
     *
     * original price = ₹100
     * discount price = ₹80
     *
     * subtotal for quantity 1 = ₹80
     *
     * Therefore, we must NOT do:
     *
     * subtotal - discount
     *
     * because that would subtract the discount twice.
     *
     * Correct calculation:
     *
     * total = already-discounted subtotal + delivery charge
     */

    const subtotal = data.order.pricing.subtotal;
    const discount = data.order.pricing.discount;

    const total = subtotal + deliveryCharge;

    return {
      subtotal,
      discount,
      deliveryCharge,
      total,
    };
  }, [data, selectedCity]);

  // ======================================================
  // City Change
  // ======================================================

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    setOrderError("");
  };

  // ======================================================
  // Place Order
  // ======================================================

  const handlePlaceOrder = async () => {
    if (!data) return;

    setOrderError("");

    // --------------------------------------------------
    // Validate City
    // --------------------------------------------------

    if (!selectedCity) {
      setOrderError("Please select your city.");
      return;
    }

    // --------------------------------------------------
    // Validate Address
    // --------------------------------------------------

    if (!address.trim()) {
      setOrderError("Please enter your delivery address.");
      return;
    }

    // --------------------------------------------------
    // Validate Alternate Mobile
    // --------------------------------------------------

    if (
      alternateMobile.trim() &&
      !/^[0-9+\-\s()]{7,15}$/.test(alternateMobile.trim())
    ) {
      setOrderError("Please enter a valid alternate mobile number.");
      return;
    }

    try {
      setPlacingOrder(true);

      // --------------------------------------------------
      // Buy Now Parameters
      // --------------------------------------------------

      const productId = searchParams.get("productId") || undefined;

      const variantIndexParam = searchParams.get("variantIndex");

      const quantityParam = searchParams.get("quantity");

      // --------------------------------------------------
      // Place Order
      // --------------------------------------------------

      const response = await placeOrder({
        type: data.type,

        ...(data.type === "buyNow"
          ? {
              productId,

              variantIndex:
                variantIndexParam !== null ? Number(variantIndexParam) : -1,

              quantity:
                quantityParam && Number(quantityParam) > 0
                  ? Number(quantityParam)
                  : 1,
            }
          : {}),

        cityId: selectedCity,

        address: address.trim(),

        // IMPORTANT:
        // Only send alternateMobile when provided.
        ...(alternateMobile.trim()
          ? {
              alternateMobile: alternateMobile.trim(),
            }
          : {}),

        paymentMethod,
      });

      if (!response.success) {
        setOrderError(response.message || "Failed to place order.");
        return;
      }

      // --------------------------------------------------
      // Cart Checkout
      // --------------------------------------------------

      if (data.type === "cart") {
        window.dispatchEvent(new Event("cart-updated"));
      }

      // --------------------------------------------------
      // Order Success
      // --------------------------------------------------

      if (response.order?.id) {
        router.push(`/groceries/orders/${response.order.id}`);
        return;
      }

      setOrderError(
        "Order was placed, but the order details could not be opened.",
      );
    } catch (err: any) {
      console.error("Place Order Error:", err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        router.replace("/login");
        return;
      }

      setOrderError(err?.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // ======================================================
  // Loading
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Loading checkout...
        </div>
      </div>
    );
  }

  // ======================================================
  // Error
  // ======================================================

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            !
          </div>

          <h1 className="mt-4 text-lg font-semibold text-gray-900">
            Unable to load checkout
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error || "Something went wrong while loading checkout."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/groceries")}
            className="mt-5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // Checkout
  // ======================================================

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag size={24} className="text-green-600" />

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Checkout
          </h1>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Review your order and enter your delivery details.
        </p>
      </div>

      {/* Unavailable Items */}

      {data.order.unavailableItems &&
        data.order.unavailableItems.length > 0 && (
          <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="font-semibold text-yellow-800">
              Some products are unavailable
            </p>

            <div className="mt-2 space-y-1 text-sm text-yellow-700">
              {data.order.unavailableItems.map((item, index) => (
                <p key={index}>
                  {item.productName || "Product"} — {item.reason}
                </p>
              ))}
            </div>
          </div>
        )}

      {/* Main Layout */}

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        {/* Left */}

        <div className="space-y-5">
          <CheckoutCustomer customer={data.customer} />

          <CheckoutAddress
            cities={data.cities}
            selectedCity={selectedCity}
            address={address}
            alternateMobile={alternateMobile}
            onCityChange={handleCityChange}
            onAddressChange={setAddress}
            onAlternateMobileChange={setAlternateMobile}
          />

          <CheckoutPayment
            selectedPayment={paymentMethod}
            onPaymentChange={setPaymentMethod}
          />
        </div>

        {/* Right */}

        <div className="lg:sticky lg:top-5 lg:self-start">
          <CheckoutSummary
            items={data.order.items}
            pricing={checkoutPricing || data.order.pricing}
          />

          {/* Error */}

          {orderError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {orderError}
            </div>
          )}

          {/* Place Order */}

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placingOrder ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <ShoppingBag size={19} />
                Place Order · ₹
                {checkoutPricing?.total ?? data.order.pricing.total}
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            By placing your order, you agree to receive your order at the
            provided delivery address.
          </p>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// Suspense Boundary
// ======================================================

export default function GroceryCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-gray-500">Loading checkout...</div>
        </div>
      }
    >
      <GroceryCheckoutContent />
    </Suspense>
  );
}
