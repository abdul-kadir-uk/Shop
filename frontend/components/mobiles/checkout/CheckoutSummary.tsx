// components/mobiles/checkout/CheckoutSummary.tsx
"use client";

type CheckoutItem = {
  product: string;
  productName: string;
  brand: string;
  image: string;
  quantity: number;

  variantGroupId?: string;
  variantName?: string;
  ram?: string;
  storage?: string;

  color?: string;
  colorPrice?: number | null;

  // Original product price
  price: number;

  // Effective discount/selling price
  discountPrice: number | null;

  // Final price actually paid
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

type CheckoutSummaryProps = {
  items: CheckoutItem[];
  pricing: Pricing;
};

const formatPrice = (value: number | null | undefined) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

export default function CheckoutSummary({
  items,
  pricing,
}: CheckoutSummaryProps) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Order Summary
      </h2>

      {/* ==================================================
          ITEMS
      ================================================== */}

      <div className="space-y-4">
        {items.map((item, index) => {
          /*
           * IMPORTANT:
           *
           * item.price = ALWAYS the original product price.
           *
           * Example:
           *
           * Product price: ₹92,999
           *
           * Black  color price: ₹85,999
           * Blue   color price: ₹79,999
           * Silver color price: ₹71,999
           *
           * item.sellingPrice = final price after applying
           * the color price / normal discount.
           */

          const originalPrice = Number(item.price);

          const sellingPrice = Number(item.sellingPrice);

          const hasDiscount =
            item.discountPrice !== null &&
            item.discountPrice !== undefined &&
            Number(item.discountPrice) > 0 &&
            Number(item.discountPrice) < originalPrice;

          const discountPercentage =
            hasDiscount && originalPrice > 0
              ? Math.round(
                  ((originalPrice - sellingPrice) / originalPrice) * 100,
                )
              : 0;

          const itemTotal = sellingPrice * Number(item.quantity || 0);

          const itemDiscount = hasDiscount
            ? Math.max(
                (originalPrice - sellingPrice) * Number(item.quantity || 0),
                0,
              )
            : 0;

          return (
            <div
              key={`${item.product}-${item.color || ""}-${index}`}
              className="border-b pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex gap-3">
                {/* ==================================================
                    IMAGE
                ================================================== */}

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

                {/* ==================================================
                    INFORMATION
                ================================================== */}

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                    {item.productName}
                  </h3>

                  {item.brand && (
                    <p className="mt-0.5 text-xs text-gray-500">{item.brand}</p>
                  )}

                  {/* ==================================================
                      VARIANT
                  ================================================== */}

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>Qty: {item.quantity}</span>

                    {item.variantName && <span>{item.variantName}</span>}

                    {item.ram && <span>{item.ram} RAM</span>}

                    {item.storage && <span>{item.storage}</span>}
                  </div>

                  {/* ==================================================
                      COLOR
                  ================================================== */}

                  {item.color && (
                    <p className="mt-1 text-xs font-medium text-gray-600">
                      Color: <span className="text-gray-900">{item.color}</span>
                    </p>
                  )}

                  {/* ==================================================
                      COLOR PRICE
                  ================================================== */}

                  {item.colorPrice !== null &&
                    item.colorPrice !== undefined &&
                    Number(item.colorPrice) > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Color price: {formatPrice(item.colorPrice)}
                      </p>
                    )}

                  {/* ==================================================
                      PRICE DETAILS
                  ================================================== */}

                  <div className="mt-2">
                    {hasDiscount ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Original Price */}

                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(originalPrice)}
                        </span>

                        {/* Final Selling Price */}

                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(sellingPrice)}
                        </span>

                        {/* Discount Percentage */}

                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                          {discountPercentage}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(sellingPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ==================================================
                    ITEM TOTAL
                ================================================== */}

                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-500">Item Total</p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {formatPrice(itemTotal)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================
          ORDER PRICING
      ================================================== */}

      <div className="mt-5 space-y-3 border-t pt-4 text-sm">
        {/* ==================================================
            ORIGINAL SUBTOTAL
        ================================================== */}

        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>

          <span className="font-medium text-gray-900">
            {formatPrice(
              Number(pricing.subtotal || 0) + Number(pricing.discount || 0),
            )}
          </span>
        </div>

        {/* ==================================================
            DISCOUNT
        ================================================== */}

        <div className="flex justify-between">
          <span className="text-gray-500">Discount</span>

          <span className="font-medium text-green-600">
            -{formatPrice(pricing.discount)}
          </span>
        </div>

        {/* ==================================================
            PRODUCT TOTAL
        ================================================== */}

        <div className="flex justify-between">
          <span className="text-gray-500">Product Total</span>

          <span className="font-medium text-gray-900">
            {formatPrice(pricing.subtotal)}
          </span>
        </div>

        {/* ==================================================
            DELIVERY CHARGE
        ================================================== */}

        <div className="flex justify-between">
          <span className="text-gray-500">Delivery Charge</span>

          <span className="font-medium text-gray-900">
            {Number(pricing.deliveryCharge || 0) > 0
              ? formatPrice(pricing.deliveryCharge)
              : "Free"}
          </span>
        </div>

        {/* ==================================================
            TOTAL
        ================================================== */}

        <div className="flex justify-between border-t pt-3 text-base">
          <span className="font-semibold text-gray-900">Total</span>

          <span className="text-xl font-bold text-blue-600">
            {formatPrice(pricing.total)}
          </span>
        </div>
      </div>
    </section>
  );
}
