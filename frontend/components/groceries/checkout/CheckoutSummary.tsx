// components/groceries/checkout/CheckoutSummary.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Tag, CheckCircle2 } from "lucide-react";

type CheckoutItem = {
  product: string;
  productName: string;
  brand: string;
  image: string;
  quantity: number;

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
  promoCode?: string | null;
  promoDiscount?: number;
};

type CheckoutSummaryProps = {
  items: CheckoutItem[];
  pricing: Pricing;

  appliedPromoCode: string;
  applyingPromo: boolean;
  promoMessage: string;
  promoError: string;

  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
};

const PROMO_OFFERS = [
  {
    code: "GROCERY50",
    title: "Flat ₹50 OFF",
    description: "Save ₹50 on your grocery order.",
    minimumSubtotal: 500,
    discountText: "₹50 discount",
  },
  {
    code: "GROCERY30",
    title: "Flat ₹30 OFF",
    description: "Save ₹30 on your grocery order.",
    minimumSubtotal: 300,
    discountText: "₹30 discount",
  },
  {
    code: "GROCERY10",
    title: "10% OFF",
    description: "Get 10% off, up to ₹50.",
    minimumSubtotal: 100,
    discountText: "10% discount up to ₹50",
  },
];

export default function CheckoutSummary({
  items,
  pricing,
  appliedPromoCode,
  applyingPromo,
  promoMessage,
  promoError,
  onApplyPromo,
  onRemovePromo,
}: CheckoutSummaryProps) {
  const [showOffers, setShowOffers] = useState(false);

  const promoDiscount = pricing.promoDiscount ?? 0;

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Order Summary
      </h2>

      {/* Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item.product}-${index}`}
            className="border-b pb-4 last:border-b-0 last:pb-0"
          >
            <div className="flex gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                  {item.productName}
                </h3>

                {item.brand && (
                  <p className="mt-0.5 text-xs text-gray-500">{item.brand}</p>
                )}

                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
                  <span>Qty: {item.quantity}</span>
                  {item.variant?.label && <span>{item.variant.label}</span>}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-semibold text-gray-900">₹{item.subtotal}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Available Promo Codes */}
      <div className="mt-5 rounded-xl border border-green-200 bg-green-50/60 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => setShowOffers((previous) => !previous)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={showOffers}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-green-700">
              <Tag size={21} />
            </span>

            <span className="min-w-0">
              <span className="block font-semibold text-gray-900">
                {appliedPromoCode
                  ? `${appliedPromoCode} applied`
                  : "Save more with offers"}
              </span>

              <span className="mt-0.5 block text-xs text-gray-600">
                View available promo codes
              </span>
            </span>
          </span>

          {showOffers ? (
            <ChevronUp size={20} className="shrink-0 text-gray-600" />
          ) : (
            <ChevronDown size={20} className="shrink-0 text-gray-600" />
          )}
        </button>

        {showOffers && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-600">
              Offers are for new grocery customers only. Each order can use one
              promo code.
            </p>

            {PROMO_OFFERS.map((offer) => {
              const minimumMet = pricing.subtotal >= offer.minimumSubtotal;

              const isApplied = appliedPromoCode === offer.code;

              const anotherPromoApplied =
                Boolean(appliedPromoCode) && !isApplied;

              return (
                <div
                  key={offer.code}
                  className={`rounded-lg border bg-white p-3 ${
                    isApplied
                      ? "border-green-500 ring-1 ring-green-200"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded border border-dashed border-green-600 px-2 py-1 text-sm font-bold tracking-wide text-green-700">
                          {offer.code}
                        </span>

                        {isApplied && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <CheckCircle2 size={14} />
                            Applied
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-semibold text-gray-900">
                        {offer.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        {offer.description}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Minimum grocery subtotal: ₹{offer.minimumSubtotal}
                      </p>

                      {!minimumMet && (
                        <p className="mt-1 text-xs font-medium text-orange-700">
                          Add ₹{offer.minimumSubtotal - pricing.subtotal} more
                          to unlock this offer.
                        </p>
                      )}
                    </div>

                    {isApplied ? (
                      <button
                        type="button"
                        onClick={onRemovePromo}
                        disabled={applyingPromo}
                        className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onApplyPromo(offer.code)}
                        disabled={
                          applyingPromo || !minimumMet || anotherPromoApplied
                        }
                        className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {applyingPromo ? "Applying..." : "Apply"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {promoMessage && (
              <p className="text-sm font-medium text-green-700">
                {promoMessage}
              </p>
            )}

            {promoError && <p className="text-sm text-red-600">{promoError}</p>}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="mt-5 space-y-3 border-t pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">₹{pricing.subtotal}</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Delivery Charge</span>
          <span className="font-medium text-gray-900">
            {pricing.deliveryCharge > 0 ? `₹${pricing.deliveryCharge}` : "Free"}
          </span>
        </div>

        {promoDiscount > 0 && (
          <div className="flex items-center justify-between gap-3 text-green-700">
            <span>
              Promo Discount
              {pricing.promoCode ? ` (${pricing.promoCode})` : ""}
            </span>

            <span className="font-semibold">-₹{promoDiscount}</span>
          </div>
        )}

        <div className="flex justify-between gap-3 border-t pt-3 text-base">
          <span className="font-semibold text-gray-900">Total</span>

          <span className="text-xl font-bold text-green-600">
            ₹{pricing.total}
          </span>
        </div>
      </div>
    </section>
  );
}
