// components/mobiles/cart/CartItem.tsx

"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

type CartItemData = {
  productId: string;
  productName: string;
  slug: string;
  brand: string;
  image: string | null;
  seller: any;
  quantity: number;

  // Color
  color?: string | null;
  colorPrice?: number | null;

  // Variant
  variantGroupId?: string | null;
  variantName?: string | null;
  ram?: string | null;
  storage?: string | null;

  // Price
  originalPrice: number;
  sellingPrice: number;
  discountPrice?: number | null;
  subtotal: number;
  discount?: number;

  isAvailable: boolean;
};

type CartItemProps = {
  item: CartItemData;
  updating: boolean;

  onUpdateQuantity: (
    productId: string,
    quantity: number,
    color: string,
  ) => void;

  onRemove: (productId: string, color: string) => void;
};

export default function CartItem({
  item,
  updating,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const selectedColor = item.color || "";

  // ======================================================
  // DECREASE QUANTITY
  // ======================================================

  const decreaseQuantity = () => {
    if (item.quantity <= 1) {
      onRemove(item.productId, selectedColor);
      return;
    }

    onUpdateQuantity(item.productId, item.quantity - 1, selectedColor);
  };

  // ======================================================
  // INCREASE QUANTITY
  // ======================================================

  const increaseQuantity = () => {
    onUpdateQuantity(item.productId, item.quantity + 1, selectedColor);
  };

  return (
    <div className="flex gap-3 border-b p-3 last:border-b-0 sm:gap-4 sm:p-4">
      {/* ==================================================
          IMAGE
      ================================================== */}

      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-28">
        <img
          src={item.image || "https://placehold.co/300x300/png"}
          alt={item.productName}
          className="h-full w-full object-cover"
        />
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            {/* Brand */}
            <p className="truncate text-xs text-gray-500">
              {item.brand || "-"}
            </p>

            {/* Product Name */}
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
              {item.productName}
            </h3>

            {/* ==================================================
                VARIANT
            ================================================== */}

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              {item.variantName && <span>{item.variantName}</span>}

              {item.ram && <span>RAM: {item.ram}</span>}

              {item.storage && <span>Storage: {item.storage}</span>}
            </div>

            {/* ==================================================
                COLOR
            ================================================== */}

            {selectedColor && (
              <p className="mt-1 text-xs font-medium text-gray-600">
                Color: <span className="text-gray-900">{selectedColor}</span>
              </p>
            )}
          </div>

          {/* ==================================================
              REMOVE
          ================================================== */}

          <button
            type="button"
            disabled={updating}
            onClick={() => onRemove(item.productId, selectedColor)}
            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            aria-label={`Remove ${item.productName}${
              selectedColor ? ` ${selectedColor}` : ""
            }`}
          >
            <Trash2 size={17} />
          </button>
        </div>

        {/* ==================================================
            AVAILABILITY
        ================================================== */}

        {!item.isAvailable && (
          <p className="mt-2 text-xs font-medium text-red-500">
            Currently unavailable
          </p>
        )}

        {/* ==================================================
            PRICE
        ================================================== */}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-bold text-blue-600">
            ₹{Number(item.sellingPrice).toLocaleString("en-IN")}
          </span>

          {Number(item.originalPrice) > Number(item.sellingPrice) && (
            <span className="text-xs text-gray-400 line-through">
              ₹{Number(item.originalPrice).toLocaleString("en-IN")}
            </span>
          )}

          {item.originalPrice > item.sellingPrice && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600">
              {Math.round(
                ((item.originalPrice - item.sellingPrice) /
                  item.originalPrice) *
                  100,
              )}
              % OFF
            </span>
          )}
        </div>

        {/* ==================================================
            COLOR PRICE INFORMATION
        ================================================== */}

        {item.colorPrice !== null && item.colorPrice !== undefined && (
          <p className="mt-1 text-xs text-gray-500">
            Color price: ₹{Number(item.colorPrice).toLocaleString("en-IN")}
          </p>
        )}

        {/* ==================================================
            QUANTITY + SUBTOTAL
        ================================================== */}

        <div className="mt-3 flex items-center justify-between gap-2">
          {/* Quantity Controls */}
          <div className="flex items-center overflow-hidden rounded-lg border">
            <button
              type="button"
              disabled={updating || !item.isAvailable}
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
              disabled={updating || !item.isAvailable}
              onClick={increaseQuantity}
              className="flex h-8 w-8 items-center justify-center transition hover:bg-gray-100 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Item Total */}
          <p className="text-sm font-semibold text-gray-900">
            ₹{Number(item.subtotal).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}
