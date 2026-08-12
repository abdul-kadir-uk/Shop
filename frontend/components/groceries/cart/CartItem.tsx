// components/groceries/cart/CartItem.tsx

"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

type CartItemData = {
  productId: string;
  productName: string;
  slug: string;
  brand: string;
  image: string | null;
  variantIndex: number;
  variantLabel: string | null;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
  subtotal: number;
  isAvailable: boolean;
};

type CartItemProps = {
  item: CartItemData;
  updating: boolean;
  onUpdateQuantity: (
    productId: string,
    quantity: number,
    variantIndex: number,
  ) => void;
  onRemove: (productId: string, variantIndex: number) => void;
};

export default function CartItem({
  item,
  updating,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const decreaseQuantity = () => {
    if (item.quantity <= 1) {
      onRemove(item.productId, item.variantIndex);
      return;
    }

    onUpdateQuantity(item.productId, item.quantity - 1, item.variantIndex);
  };

  const increaseQuantity = () => {
    onUpdateQuantity(item.productId, item.quantity + 1, item.variantIndex);
  };

  return (
    <div className="flex gap-3 border-b p-3 last:border-b-0 sm:gap-4 sm:p-4">
      {/* Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-28">
        <Image
          src={item.image || "https://placehold.co/300x300/png"}
          alt={item.productName}
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">
              {item.brand || "-"}
            </p>

            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
              {item.productName}
            </h3>

            {item.variantLabel && (
              <p className="mt-1 text-xs text-gray-500">{item.variantLabel}</p>
            )}
          </div>

          {/* Remove */}
          <button
            type="button"
            disabled={updating}
            onClick={() => onRemove(item.productId, item.variantIndex)}
            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            aria-label={`Remove ${item.productName}`}
          >
            <Trash2 size={17} />
          </button>
        </div>

        {/* Price */}
        <div className="mt-2">
          <span className="font-bold text-green-600">₹{item.sellingPrice}</span>

          {item.originalPrice > item.sellingPrice && (
            <span className="ml-2 text-xs text-gray-400 line-through">
              ₹{item.originalPrice}
            </span>
          )}
        </div>

        {/* Quantity + subtotal */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {/* Quantity Controls */}
          <div className="flex items-center overflow-hidden rounded-lg border">
            <button
              type="button"
              disabled={updating}
              onClick={decreaseQuantity}
              className="flex h-8 w-8 items-center justify-center transition hover:bg-gray-100 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>

            <span className="flex h-8 min-w-8 items-center justify-center border-x px-2 text-sm font-medium">
              {item.quantity}
            </span>

            <button
              type="button"
              disabled={updating}
              onClick={increaseQuantity}
              className="flex h-8 w-8 items-center justify-center transition hover:bg-gray-100 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Item Total */}
          <p className="text-sm font-semibold text-gray-900">
            ₹{item.subtotal}
          </p>
        </div>
      </div>
    </div>
  );
}
