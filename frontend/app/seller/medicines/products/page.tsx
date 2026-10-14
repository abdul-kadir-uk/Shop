// app/seller/medicine/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface MedicineProduct {
  _id: string;
  productName: string;
  slug?: string;
  brand: string;
  composition?: string;
  strength?: string;
  dosageForm?: string;
  packSize?: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  requiresPrescription?: boolean;
  mainImage?: {
    url: string;
    key?: string;
  };
}

interface MedicineProductsResponse {
  success?: boolean;
  products?: MedicineProduct[];
  totalPages?: number;
}

export default function MedicineProductsPage() {
  const [products, setProducts] = useState<MedicineProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedDosageForm, setSelectedDosageForm] = useState("");

  // Image preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (currentPage = page) => {
    try {
      setLoading(true);

      const { data } = await api.get<MedicineProductsResponse>(
        `/seller/medicine/products?page=${currentPage}&limit=10&search=${encodeURIComponent(
          searchQuery,
        )}&brand=${encodeURIComponent(
          selectedBrand,
        )}&dosageForm=${encodeURIComponent(selectedDosageForm)}`,
      );

      setProducts(data.products || []);
      setTotalPages(Math.max(1, data.totalPages || 1));
    } catch (error) {
      console.error("Failed to load Medicine products:", error);
      alert("Failed to load Medicine products.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this Medicine product?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/seller/medicine/products/${id}`);

      setProducts((prev) => prev.filter((product) => product._id !== id));

      alert("Medicine product deleted successfully.");

      // Refresh the current page if it became empty after deletion.
      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchProducts(page);
      }
    } catch (error: any) {
      console.error("Failed to delete Medicine product:", error);

      alert(
        error.response?.data?.message || "Failed to delete Medicine product.",
      );
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProducts(1);
  };

  useEffect(() => {
    fetchProducts(page);
    // Fetch when the page changes.
    // Search/filter changes are handled by handleSearch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Medicine Products</h1>

          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Manage all your Medicine products.
          </p>
        </div>

        <Link
          href="/seller/medicine/products/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-center w-full sm:w-fit"
        >
          + Add Medicine
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border shadow rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Search */}
          <input
            type="text"
            name="searchQuery"
            placeholder="Search by medicine name or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          {/* Brand */}
          <select
            name="brand"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Brands</option>
            <option value="Cipla">Cipla</option>
            <option value="Sun Pharma">Sun Pharma</option>
            <option value="Dr. Reddy's">Dr. Reddy&apos;s</option>
            <option value="Mankind">Mankind</option>
            <option value="Zydus">Zydus</option>
            <option value="Abbott">Abbott</option>
            <option value="Other">Other</option>
          </select>

          {/* Dosage Form */}
          <select
            name="dosageForm"
            value={selectedDosageForm}
            onChange={(e) => setSelectedDosageForm(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Dosage Forms</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Injection">Injection</option>
            <option value="Cream">Cream</option>
            <option value="Ointment">Ointment</option>
            <option value="Drops">Drops</option>
            <option value="Powder">Powder</option>
            <option value="Other">Other</option>
          </select>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium py-2"
          >
            Search
          </button>
        </div>
      </div>

      {/* Loading / Empty / Products */}
      {loading ? (
        <div className="bg-white rounded-xl shadow border py-20 text-center">
          <p className="text-gray-500">Loading Medicine products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow border py-16 text-center">
          <h2 className="text-xl font-semibold">No Medicine Products Found</h2>

          <p className="text-gray-500 mt-2">
            Start by adding your first Medicine product.
          </p>

          <Link
            href="/seller/medicine/products/add"
            className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Add Your First Medicine
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left">Image</th>
                  <th className="px-5 py-3 text-left">Medicine</th>
                  <th className="px-5 py-3 text-left">Brand</th>
                  <th className="px-5 py-3 text-left">Strength / Form</th>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-4">
                      {product.mainImage?.url ? (
                        <img
                          src={product.mainImage.url}
                          alt={product.productName}
                          onClick={() =>
                            setSelectedImage(product.mainImage!.url)
                          }
                          className="w-16 h-16 rounded-lg object-cover border cursor-pointer hover:opacity-80"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          No image
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">{product.productName}</p>

                      {product.composition && (
                        <p className="text-sm text-gray-500 mt-1">
                          {product.composition}
                        </p>
                      )}

                      {product.requiresPrescription && (
                        <span className="inline-block mt-1 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                          Prescription required
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">{product.brand || "—"}</td>

                    <td className="px-5 py-4">
                      <p>{product.strength || "—"}</p>
                      <p className="text-sm text-gray-500">
                        {product.dosageForm || "—"}
                      </p>
                      {product.packSize && (
                        <p className="text-sm text-gray-500">
                          Pack: {product.packSize}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {product.discountPrice != null &&
                      product.discountPrice > 0 ? (
                        <div className="flex flex-col">
                          <span className="line-through text-gray-400">
                            ₹{product.price}
                          </span>
                          <span className="font-semibold text-blue-600">
                            ₹{product.discountPrice}
                          </span>
                        </div>
                      ) : (
                        <span>₹{product.price}</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {product.isAvailable ? (
                        <span className="text-green-600 font-medium">
                          Available
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          Unavailable
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Link
                          href={`/seller/medicine/products/view/${product._id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        >
                          View
                        </Link>

                        <Link
                          href={`/seller/medicine/products/edit/${product._id}`}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => handleDelete(product._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="border rounded-xl p-4 space-y-3"
              >
                <div className="flex gap-3">
                  {product.mainImage?.url ? (
                    <img
                      src={product.mainImage.url}
                      alt={product.productName}
                      onClick={() => setSelectedImage(product.mainImage!.url)}
                      className="w-20 h-20 rounded-lg object-cover border cursor-pointer hover:opacity-80 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0">
                      No image
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-semibold">{product.productName}</h3>

                    <p className="text-sm text-gray-500">
                      {product.brand || "—"}
                    </p>

                    <p className="text-sm text-gray-500">
                      {[product.strength, product.dosageForm]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>

                    {product.packSize && (
                      <p className="text-sm text-gray-500">
                        Pack: {product.packSize}
                      </p>
                    )}

                    <p className="font-medium mt-1">
                      {product.discountPrice != null &&
                      product.discountPrice > 0 ? (
                        <>
                          <span className="line-through text-gray-400 mr-2">
                            ₹{product.price}
                          </span>
                          <span className="font-semibold text-blue-600">
                            ₹{product.discountPrice}
                          </span>
                        </>
                      ) : (
                        <>₹{product.price}</>
                      )}
                    </p>
                  </div>
                </div>

                {product.requiresPrescription && (
                  <p className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded inline-block">
                    Prescription required
                  </p>
                )}

                <div>
                  {product.isAvailable ? (
                    <span className="text-green-600 font-medium">
                      Available
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      Unavailable
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/seller/medicine/products/view/${product._id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    View
                  </Link>

                  <Link
                    href={`/seller/medicine/products/edit/${product._id}`}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(product._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="border-t p-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className={`px-6 py-2 rounded-lg font-medium ${
                page === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              }`}
            >
              Previous
            </button>

            <span className="font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className={`px-6 py-2 rounded-lg font-medium ${
                page >= totalPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              aria-label="Close image preview"
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-black text-xl font-bold shadow hover:bg-gray-200"
            >
              ×
            </button>

            <img
              src={selectedImage}
              alt="Medicine product preview"
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
