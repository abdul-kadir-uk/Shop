// components/mobiles/orders/OrderProduct.tsx
"use client";

import OrderStatus from "./OrderStatus";

type OrderItem = {
  product: string;
  productName: string;
  image: string;
  brand: string;
  quantity: number;

  variantGroupId?: string;
  variantName?: string;
  ram?: string;
  storage?: string;

  color?: string;
  colorPrice?: number | null;

  price: number;
  discountPrice: number | null;
  subtotal: number;
  orderStatus: string;
};

type OrderProductProps = {
  items: OrderItem[];
};

export default function OrderProduct({ items }: OrderProductProps) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">Order Items</h2>

      <div className="divide-y">
        {items.map((item, index) => {
          const originalPrice = Number(item.price);

          const hasColorPrice =
            item.colorPrice !== null &&
            item.colorPrice !== undefined &&
            Number(item.colorPrice) > 0;

          const currentColorPrice = hasColorPrice
            ? Number(item.colorPrice)
            : null;

          const currentDiscountPrice =
            hasColorPrice && currentColorPrice! < originalPrice
              ? currentColorPrice
              : !hasColorPrice &&
                  item.discountPrice !== null &&
                  item.discountPrice !== undefined &&
                  Number(item.discountPrice) > 0 &&
                  Number(item.discountPrice) < originalPrice
                ? Number(item.discountPrice)
                : null;

          const sellingPrice = hasColorPrice
            ? currentColorPrice!
            : (currentDiscountPrice ?? originalPrice);

          const hasDiscount =
            currentDiscountPrice !== null &&
            currentDiscountPrice < originalPrice;

          return (
            <div
              key={`${item.product}-${index}`}
              className="flex gap-4 py-5 first:pt-0 last:pb-0"
            >
              {/* Image */}
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-28">
                {item.image ? (
                  <img
                    src={item.image}
                    loading="eager"
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-semibold text-gray-900 sm:text-lg">
                      {item.productName}
                    </h3>

                    {item.brand && (
                      <p className="mt-1 text-sm text-gray-500">{item.brand}</p>
                    )}
                  </div>

                  {/* Item Status */}
                  <div className="shrink-0">
                    <OrderStatus status={item.orderStatus} />
                  </div>
                </div>

                {/* Mobile Variant */}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-md bg-gray-100 px-2 py-1">
                    Qty: {item.quantity}
                  </span>

                  {item.variantName && (
                    <span className="rounded-md bg-gray-100 px-2 py-1">
                      {item.variantName}
                    </span>
                  )}

                  {item.ram && (
                    <span className="rounded-md bg-gray-100 px-2 py-1">
                      {item.ram} RAM
                    </span>
                  )}

                  {item.storage && (
                    <span className="rounded-md bg-gray-100 px-2 py-1">
                      {item.storage}
                    </span>
                  )}

                  {item.color && (
                    <span className="rounded-md bg-gray-100 px-2 py-1">
                      Color: {item.color}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-blue-600">
                    ₹{sellingPrice * item.quantity}
                  </span>

                  {hasDiscount && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{originalPrice * item.quantity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
