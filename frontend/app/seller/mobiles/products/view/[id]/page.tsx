// app/seller/mobiles/products/view/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import api from "@/lib/api";

interface ProductImage {
  url: string;
  key: string;
}

interface ProductColor {
  name: string;
  isAvailable: boolean;
  price: number | null;
}

interface CameraData {
  front: string;
  rear: string;
}

interface MobileProduct {
  _id: string;

  productName: string;
  slug: string;

  brand: string;
  description: string;

  variantGroupId: string | null;
  variantName: string;

  ram: string;
  storage: string;

  colors: ProductColor[];

  processor: string;
  display: string;
  camera: CameraData;
  battery: string;
  operatingSystem: string;
  warranty: string;
  charging: string;

  mainImage: ProductImage;
  descriptionImages: ProductImage[];

  price: number;
  discountPrice: number | null;

  isAvailable: boolean;

  totalSold: number;

  createdAt?: string;
  updatedAt?: string;
}

export default function ViewMobileProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [product, setProduct] = useState<MobileProduct | null>(null);
  const [loading, setLoading] = useState(true);

  // Image preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  /* ==========================================================
     FETCH PRODUCT
  ========================================================== */

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const { data } = await api.get(`/seller/mobile/products/${id}`);

        setProduct(data.product);
      } catch (error: any) {
        console.error("Failed to load mobile product:", error);

        alert(
          error.response?.data?.message || "Failed to load mobile product.",
        );

        router.push("/seller/mobiles/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-gray-500 text-lg">Loading product...</div>
      </div>
    );
  }

  /* ==========================================================
     PRODUCT NOT FOUND
  ========================================================== */

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <h2 className="text-xl font-semibold">Mobile product not found</h2>

        <Link
          href="/seller/mobiles/products"
          className="
            mt-4
            bg-gray-700
            hover:bg-gray-800
            text-white
            px-5
            py-2
            rounded-lg
          "
        >
          Back to Products
        </Link>
      </div>
    );
  }

  /* ==========================================================
     PRICE
  ========================================================== */

  const hasDiscount =
    product.discountPrice !== null &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Mobile Product Details
          </h1>

          <p className="text-gray-500 mt-1">
            View complete information about this product.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/seller/mobiles/products"
            className="
              border
              border-gray-300
              hover:bg-gray-100
              px-4
              py-2
              rounded-lg
              text-sm
              font-medium
            "
          >
            Back
          </Link>

          <Link
            href={`/seller/mobiles/products/edit/${product._id}`}
            className="
              bg-yellow-500
              hover:bg-yellow-600
              text-white
              px-4
              py-2
              rounded-lg
              text-sm
              font-medium
            "
          >
            Edit Product
          </Link>
        </div>
      </div>

      {/* ======================================================
          MAIN PRODUCT CARD
      ====================================================== */}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-5 sm:p-8">
          {/* ==================================================
              IMAGES
          ================================================== */}

          <div>
            {/* Main Image */}

            <div
              className="
                border
                rounded-xl
                overflow-hidden
                bg-gray-50
                cursor-pointer
              "
              onClick={() => setSelectedImage(product.mainImage.url)}
            >
              <img
                src={product.mainImage.url}
                alt={product.productName}
                className="
                  w-full
                  h-75
                  sm:h-100
                  object-contain
                "
              />
            </div>

            {/* Description Images */}

            {product.descriptionImages &&
              product.descriptionImages.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-3">Additional Images</h3>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {product.descriptionImages.map((image, index) => (
                      <button
                        key={image.key || `${image.url}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image.url)}
                        className="
                          border
                          rounded-lg
                          overflow-hidden
                          bg-gray-50
                          hover:border-gray-400
                        "
                      >
                        <img
                          src={image.url}
                          alt={`${product.productName} ${index + 1}`}
                          className="
                            w-full
                            h-24
                            sm:h-28
                            object-cover
                          "
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* ==================================================
              BASIC PRODUCT INFORMATION
          ================================================== */}

          <div className="space-y-6">
            {/* Product Name */}

            <div>
              <p className="text-sm text-gray-500">Product Name</p>

              <h2 className="text-2xl font-bold mt-1">{product.productName}</h2>
            </div>

            {/* Brand */}

            <div>
              <p className="text-sm text-gray-500">Brand</p>

              <p className="font-medium mt-1">{product.brand || "-"}</p>
            </div>

            {/* Variant */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem
                label="Variant Name"
                value={product.variantName || "-"}
              />

              <InfoItem
                label="Variant Group ID"
                value={product.variantGroupId || "-"}
              />
            </div>

            {/* RAM / Storage */}

            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="RAM" value={product.ram || "-"} />

              <InfoItem label="Storage" value={product.storage || "-"} />
            </div>

            {/* Price */}

            <div>
              <p className="text-sm text-gray-500">Price</p>

              {hasDiscount ? (
                <div className="mt-1">
                  <span className="text-gray-400 line-through mr-3">
                    ₹{product.price}
                  </span>

                  <span className="text-2xl font-bold text-green-600">
                    ₹{product.discountPrice}
                  </span>
                </div>
              ) : (
                <p className="text-2xl font-bold mt-1">₹{product.price}</p>
              )}
            </div>

            {/* Availability */}

            <div>
              <p className="text-sm text-gray-500">Availability</p>

              <span
                className={`
                  inline-block
                  mt-1
                  px-3
                  py-1
                  rounded-full
                  text-sm
                  font-medium
                  ${
                    product.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                `}
              >
                {product.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>

            {/* Total Sold */}

            <div>
              <p className="text-sm text-gray-500">Total Sold</p>

              <p className="font-semibold mt-1">{product.totalSold}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          COLORS
      ====================================================== */}

      <div className="bg-white border rounded-xl shadow-sm p-5 sm:p-8">
        <h2 className="text-xl font-bold mb-5">Available Colors</h2>

        {product.colors && product.colors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.colors.map((color, index) => {
              const hasColorPrice =
                color.price !== null && color.price !== undefined;

              return (
                <div
                  key={`${color.name}-${index}`}
                  className="
                    border
                    rounded-lg
                    p-4
                    flex
                    flex-col
                    gap-2
                  "
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{color.name}</span>

                    <span
                      className={`
                        text-xs
                        px-2
                        py-1
                        rounded-full
                        ${
                          color.isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      `}
                    >
                      {color.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500">Color Price</div>

                  {/* Color-specific price */}

                  {hasColorPrice ? (
                    <div className="text-xl font-bold text-green-600">
                      ₹{color.price}
                    </div>
                  ) : hasDiscount ? (
                    /* No color price → use product discount price */

                    <div className="mt-1">
                      <span className="text-gray-400 line-through mr-3">
                        ₹{product.price}
                      </span>

                      <span className="text-xl font-bold text-green-600">
                        ₹{product.discountPrice}
                      </span>
                    </div>
                  ) : (
                    /* No color price and no discount → use product price */

                    <div className="text-xl font-bold">₹{product.price}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No colors added for this product.</p>
        )}
      </div>

      {/* ======================================================
          SPECIFICATIONS
      ====================================================== */}

      <div className="bg-white border rounded-xl shadow-sm p-5 sm:p-8">
        <h2 className="text-xl font-bold mb-5">Specifications</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <InfoItem label="Processor" value={product.processor || "-"} />

          <InfoItem label="Display" value={product.display || "-"} />

          {/* Camera */}

          <div>
            <p className="text-sm text-gray-500">Front Camera</p>

            <p className="font-medium mt-1 wrap-break-word">
              {product.camera?.front || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Rear Camera</p>

            <p className="font-medium mt-1 wrap-break-word">
              {product.camera?.rear || "-"}
            </p>
          </div>

          <InfoItem label="Battery" value={product.battery || "-"} />

          <InfoItem
            label="Operating System"
            value={product.operatingSystem || "-"}
          />

          <InfoItem label="Warranty" value={product.warranty || "-"} />

          <InfoItem label="Charging" value={product.charging || "-"} />
        </div>
      </div>

      {/* ======================================================
          DESCRIPTION
      ====================================================== */}

      <div className="bg-white border rounded-xl shadow-sm p-5 sm:p-8">
        <h2 className="text-xl font-bold mb-4">Description</h2>

        {product.description ? (
          <p className="text-gray-700 whitespace-pre-wrap leading-7">
            {product.description}
          </p>
        ) : (
          <p className="text-gray-500">No description added.</p>
        )}
      </div>

      {/* ======================================================
          PRODUCT DATES
      ====================================================== */}

      {(product.createdAt || product.updatedAt) && (
        <div className="bg-white border rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-bold mb-5">Product Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {product.createdAt && (
              <InfoItem
                label="Created At"
                value={new Date(product.createdAt).toLocaleString()}
              />
            )}

            {product.updatedAt && (
              <InfoItem
                label="Last Updated"
                value={new Date(product.updatedAt).toLocaleString()}
              />
            )}
          </div>
        </div>
      )}

      {/* ======================================================
          IMAGE PREVIEW MODAL
      ====================================================== */}

      {selectedImage && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/80
            flex
            items-center
            justify-center
            p-4
          "
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="
              relative
              max-w-5xl
              max-h-[90vh]
              w-full
              flex
              items-center
              justify-center
            "
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt={product.productName}
              className="
                max-w-full
                max-h-[85vh]
                object-contain
                rounded-lg
              "
            />

            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="
                absolute
                top-2
                right-2
                bg-white
                text-black
                w-9
                h-9
                rounded-full
                text-xl
                font-bold
                shadow
              "
              aria-label="Close image preview"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   REUSABLE INFO ITEM
============================================================ */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>

      <p className="font-medium mt-1 wrap-break-word">{value}</p>
    </div>
  );
}
