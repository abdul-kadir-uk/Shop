// components/groceries/checkout/CheckoutSummary.tsx

"use client";

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
};

type CheckoutSummaryProps = {
  items: CheckoutItem[];
  pricing: Pricing;
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

      {/* Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item.product}-${index}`}
            className="border-b pb-4 last:border-b-0 last:pb-0"
          >
            <div className="flex gap-3">
              {/* Image */}
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

              {/* Information */}
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

              {/* Price */}
              <div className="shrink-0 text-right">
                <p className="font-semibold text-gray-900">₹{item.subtotal}</p>

                {item.discount > 0 && (
                  <p className="text-xs text-green-600">
                    Save ₹{item.discount}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mt-5 space-y-3 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>

          <span className="font-medium text-gray-900">₹{pricing.subtotal}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Discount</span>

          <span className="font-medium text-green-600">
            -₹{pricing.discount}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Delivery Charge</span>

          <span className="font-medium text-gray-900">
            {pricing.deliveryCharge > 0 ? `₹${pricing.deliveryCharge}` : "Free"}
          </span>
        </div>

        <div className="flex justify-between border-t pt-3 text-base">
          <span className="font-semibold text-gray-900">Total</span>

          <span className="text-xl font-bold text-green-600">
            ₹{pricing.total}
          </span>
        </div>
      </div>
    </section>
  );
}
