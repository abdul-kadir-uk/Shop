"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import OrderStatus from "./OrderStatus";

type OrderProduct = {
  productId: string;
  name: string;
  image: string;
  brand: string;
  quantity: number;

  variant?: {
    quantity: number;
    unit: string;
    label: string;
  };

  price: number;
  discountPrice: number | null;
  subtotal: number;
  orderStatus: string;
};

type OrderCardProps = {
  order: {
    _id: string;
    orderNumber: string;
    orderStatus: string;
    createdAt: string;

    products: OrderProduct[];

    itemCount: number;

    pricing: {
      subtotal: number;
      discount: number;
      deliveryCharge: number;
      total: number;
    };

    paymentMethod: string;
    paymentStatus: string;
  };
};

export default function OrderCard({ order }: OrderCardProps) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/groceries/orders/${order._id}`}
      className="group block rounded-xl border bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md sm:p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
            Order #{order.orderNumber}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Placed on {formattedDate}
          </p>
        </div>

        <OrderStatus status={order.orderStatus} />
      </div>

      {/* Products */}
      <div className="divide-y">
        {order.products?.length > 0 ? (
          order.products.map((product, index) => (
            <div
              key={`${product.productId}-${index}`}
              className="flex gap-3 py-4 sm:gap-4"
            >
              {/* Image */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
                  {product.name}
                </h3>

                {product.brand && (
                  <p className="mt-1 text-xs text-gray-500">{product.brand}</p>
                )}

                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-md bg-gray-100 px-2 py-1">
                    Qty: {product.quantity}
                  </span>

                  {product.variant?.label && (
                    <span className="rounded-md bg-gray-100 px-2 py-1">
                      {product.variant.label}
                    </span>
                  )}
                </div>

                {/* Product Status */}
                <div className="mt-2">
                  <OrderStatus status={product.orderStatus} />
                </div>
              </div>

              {/* Product Price */}
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  ₹{product.subtotal}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            No products found in this order.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
          <span>
            Payment:{" "}
            <span className="font-medium text-gray-700">
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : order.paymentMethod}
            </span>
          </span>

          <span>
            Payment Status:{" "}
            <span className="font-medium capitalize text-gray-700">
              {order.paymentStatus}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div>
            <span className="text-xs text-gray-500">Total</span>

            <p className="text-lg font-bold text-green-600">
              ₹{order.pricing.total}
            </p>
          </div>

          <span className="flex items-center gap-1 text-sm font-medium text-green-600">
            View
            <ChevronRight
              size={16}
              className="transition group-hover:translate-x-1"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
