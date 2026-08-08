"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function ViewProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/seller/grocery/products/${id}`);

      setProduct(data.product);
    } catch (error) {
      console.error(error);
      alert("Failed to load product.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">Loading product...</div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>

        <Link
          href="/seller/grocery/products"
          className="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded-lg"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Product Details</h1>

          <p className="text-gray-500 mt-1">
            View complete information about this product.
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg w-full sm:w-auto"
        >
          Back
        </button>
        <Link
          href={`/seller/grocery/products/edit/${product._id}`}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg"
        >
          Edit Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-8 p-4 sm:p-6">
          {/* LEFT SIDE */}

          <div>
            {/* Main Image */}

            <img
              src={product.mainImage?.url}
              alt={product.productName}
              className="w-full rounded-xl border object-cover aspect-square"
            />

            {/* Description Images */}

            {product.descriptionImages?.length > 0 && (
              <>
                <h2 className="font-semibold mt-6 mb-3">Description Images</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {product.descriptionImages.map((image: any) => (
                    <img
                      key={image.key}
                      src={image.url}
                      alt=""
                      className="rounded-lg border h-24 sm:h-28 object-cover w-full"
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* RIGHT SIDE */}

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{product.productName}</h2>

              <p className="text-gray-500 mt-2">{product.description}</p>
            </div>

            {/* Basic Details */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info title="Category" value={product.productCategory} />

              <Info title="Product Type" value={product.productSubCategory} />

              <Info title="Brand" value={product.brand || "-"} />

              <Info
                title="Availability"
                value={product.isAvailable ? "Available" : "Unavailable"}
              />

              <Info title="Status" value={product.status} />

              <Info
                title="Inventory"
                value={product.trackInventory ? "Enabled" : "Disabled"}
              />
            </div>

            {/* Price */}

            <div className="border rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-4">Pricing</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Info title="Price" value={`₹${product.price}`} />

                <Info
                  title="Discount Price"
                  value={
                    product.discountPrice ? `₹${product.discountPrice}` : "-"
                  }
                />

                <Info
                  title="Quantity"
                  value={`${product.quantity} ${product.unit}`}
                />

                <Info title="Stock" value={product.stock} />
              </div>
            </div>

            {/* Variants */}

            {product.variants?.length > 0 && (
              <div className="border rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-4">Product Variants</h3>

                <div className="space-y-3">
                  {product.variants.map((variant: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <div>
                          <h4 className="font-semibold">
                            {variant.quantity} {variant.unit}
                          </h4>

                          {variant.isDefault && (
                            <span className="text-green-600 text-sm">
                              Default Variant
                            </span>
                          )}
                        </div>

                        <div className="text-sm space-y-1">
                          <p>
                            <strong>Price:</strong> ₹{variant.price}
                          </p>

                          <p>
                            <strong>Discount:</strong>{" "}
                            {variant.discountPrice
                              ? `₹${variant.discountPrice}`
                              : "-"}
                          </p>

                          <p>
                            <strong>Stock:</strong> {variant.stock}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  function Info({ title, value }: { title: string; value: React.ReactNode }) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-gray-500 text-sm">{title}</p>

        <p className="font-semibold mt-1 wrap-break-words">{value}</p>
      </div>
    );
  }
}
