// app/seller/medicine/products/view/[id]/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Edit,
  Image as ImageIcon,
  Package,
  Pill,
  RefreshCw,
} from "lucide-react";

import api from "@/lib/api";

type ProductImage = {
  key?: string;
  url: string;
};

type MedicineVariant = {
  _id?: string;
  name?: string;
  variantName?: string;
  strength?: string;
  dosageForm?: string;
  packSize?: string;
  price?: number;
  discountPrice?: number | null;
  quantity?: number;
  unit?: string;
  stock?: number;
  isAvailable?: boolean;
};

type MedicineProduct = {
  _id: string;
  productName?: string;
  description?: string;
  brand?: string;
  manufacturer?: string;
  productCategory?: string;
  productSubCategory?: string;
  composition?: string;
  strength?: string;
  dosageForm?: string;
  packSize?: string;
  requiresPrescription?: boolean;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  price?: number;
  discountPrice?: number | null;
  quantity?: number;
  unit?: string;
  stock?: number;
  trackInventory?: boolean;
  isAvailable?: boolean;
  status?: string;
  mainImage?: ProductImage;
  descriptionImages?: ProductImage[];
  variants?: MedicineVariant[];
  createdAt?: string;
  updatedAt?: string;
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="mt-1 wrap-break-word text-sm font-medium text-gray-900">
        {value ?? "—"}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

export default function ViewMedicineProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [product, setProduct] = useState<MedicineProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setError("Medicine product ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(`/seller/medicine/products/${id}`);

      if (!data?.product) {
        throw new Error("Medicine product was not found.");
      }

      setProduct(data.product);
    } catch (err: unknown) {
      console.error(err);

      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (
              err as {
                response?: {
                  data?: { message?: string };
                };
              }
            ).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Unable to load medicine product.";

      setError(message || "Unable to load medicine product.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading medicine product...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Pill size={26} />
        </div>

        <h1 className="text-xl font-semibold text-gray-900">
          Unable to load medicine product
        </h1>

        <p className="text-sm text-gray-500">
          {error || "The requested product could not be found."}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void fetchProduct()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Try Again
          </button>

          <Link
            href="/seller/medicine/products"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const descriptionImages = product.descriptionImages || [];
  const variants = product.variants || [];

  const sellingPrice =
    product.discountPrice !== undefined &&
    product.discountPrice !== null &&
    product.discountPrice > 0
      ? product.discountPrice
      : product.price;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/seller/medicine/products"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Pill size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Medicine Product Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View product information, pricing, inventory, and images.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/seller/medicine/products/edit/${product._id}`}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:self-center"
        >
          <Edit size={17} />
          Edit Product
        </Link>
      </div>

      {/* Main product information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Section title="Product Images">
          <div className="space-y-4">
            <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4">
              {product.mainImage?.url ? (
                <img
                  src={product.mainImage.url}
                  alt={product.productName || "Medicine product"}
                  className="max-h-80 w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <ImageIcon size={40} />
                  <span className="text-sm">No main image available</span>
                </div>
              )}
            </div>

            {descriptionImages.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Description Images
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {descriptionImages.map((image, index) => (
                    <div
                      key={image.key || `${image.url}-${index}`}
                      className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2"
                    >
                      <img
                        src={image.url}
                        alt={`${product.productName || "Medicine"} description ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Product Overview">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {product.productName || "Unnamed Medicine"}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {product.brand || "Brand not specified"}
                {product.manufacturer ? ` · ${product.manufacturer}` : ""}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    product.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.isAvailable ? "Available" : "Unavailable"}
                </span>

                {product.status && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                    {product.status}
                  </span>
                )}

                {product.requiresPrescription && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    Prescription Required
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">Selling Price</p>

              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(sellingPrice)}
                </span>

                {product.discountPrice !== undefined &&
                  product.discountPrice !== null &&
                  product.discountPrice > 0 &&
                  product.price !== undefined &&
                  product.discountPrice < product.price && (
                    <span className="text-base text-gray-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail label="Category" value={product.productCategory} />
              <Detail label="Subcategory" value={product.productSubCategory} />
              <Detail label="Strength" value={product.strength} />
              <Detail label="Dosage Form" value={product.dosageForm} />
              <Detail label="Pack Size" value={product.packSize} />
              <Detail label="Composition" value={product.composition} />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Description
              </h3>
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-600">
                {product.description || "No description provided."}
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* Pricing and inventory */}
      <Section title="Pricing & Inventory">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Original Price" value={formatPrice(product.price)} />
          <Detail
            label="Discount Price"
            value={
              product.discountPrice !== undefined &&
              product.discountPrice !== null &&
              product.discountPrice > 0
                ? formatPrice(product.discountPrice)
                : "No discount"
            }
          />
          <Detail
            label="Quantity per Pack"
            value={
              product.quantity !== undefined
                ? `${product.quantity}${product.unit ? ` ${product.unit}` : ""}`
                : "—"
            }
          />
          <Detail
            label="Available Stock"
            value={
              product.trackInventory
                ? (product.stock ?? 0)
                : "Inventory tracking disabled"
            }
          />
          <Detail
            label="Inventory Tracking"
            value={product.trackInventory ? "Enabled" : "Disabled"}
          />
          <Detail
            label="Availability"
            value={product.isAvailable ? "Available" : "Unavailable"}
          />
        </div>
      </Section>

      {/* Medicine and batch information */}
      <Section title="Medicine & Batch Information">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Manufacturer" value={product.manufacturer} />
          <Detail label="Brand" value={product.brand} />
          <Detail label="Batch Number" value={product.batchNumber} />
          <Detail
            label="Manufacturing Date"
            value={formatDate(product.manufacturingDate)}
          />
          <Detail label="Expiry Date" value={formatDate(product.expiryDate)} />
          <Detail
            label="Prescription"
            value={product.requiresPrescription ? "Required" : "Not required"}
          />
        </div>
      </Section>

      {/* Variants */}
      {variants.length > 0 && (
        <Section title={`Product Variants (${variants.length})`}>
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={
                  variant._id ||
                  `${variant.name || variant.variantName || "variant"}-${index}`
                }
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {variant.name ||
                      variant.variantName ||
                      `Variant ${index + 1}`}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      variant.isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {variant.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Detail label="Strength" value={variant.strength} />
                  <Detail label="Dosage Form" value={variant.dosageForm} />
                  <Detail label="Pack Size" value={variant.packSize} />
                  <Detail
                    label="Original Price"
                    value={formatPrice(variant.price)}
                  />
                  <Detail
                    label="Discount Price"
                    value={
                      variant.discountPrice !== undefined &&
                      variant.discountPrice !== null &&
                      variant.discountPrice > 0
                        ? formatPrice(variant.discountPrice)
                        : "No discount"
                    }
                  />
                  <Detail
                    label="Quantity"
                    value={
                      variant.quantity !== undefined
                        ? `${variant.quantity}${variant.unit ? ` ${variant.unit}` : ""}`
                        : "—"
                    }
                  />
                  <Detail
                    label="Stock"
                    value={
                      product.trackInventory
                        ? (variant.stock ?? 0)
                        : "Inventory tracking disabled"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Record information */}
      <Section title="Record Information">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Detail
            label="Product ID"
            value={<span className="break-all">{product._id}</span>}
          />

          <Detail
            label="Created At"
            value={
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={15} />
                {formatDate(product.createdAt)}
              </span>
            }
          />

          <Detail
            label="Last Updated"
            value={
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={15} />
                {formatDate(product.updatedAt)}
              </span>
            }
          />

          <Detail
            label="Inventory Status"
            value={
              <span className="inline-flex items-center gap-2">
                <Package size={15} />
                {product.trackInventory
                  ? `${product.stock ?? 0} units in stock`
                  : "Not tracked"}
              </span>
            }
          />
        </div>
      </Section>

      {/* Bottom actions */}
      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href="/seller/medicine/products"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>

        <Link
          href={`/seller/medicine/products/edit/${product._id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Edit size={17} />
          Edit Product
        </Link>
      </div>
    </div>
  );
}
