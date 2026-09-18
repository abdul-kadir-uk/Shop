"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface ProductColor {
  name: string;
  isAvailable: boolean;
  price: number | null;
}

interface Product {
  _id: string;
  productName: string;
  brand: string;
  variantGroupId: string | null;
  variantName: string;
  ram: string;
  storage: string;
  colors: ProductColor[];
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  mainImage: {
    url: string;
  };
}

const MOBILE_BRANDS = [
  "Apple",
  "Samsung",
  "OnePlus",
  "Xiaomi",
  "Redmi",
  "Realme",
  "Vivo",
  "Oppo",
  "Motorola",
  "Google",
  "Nothing",
  "iQOO",
  "Poco",
  "Honor",
  "Nokia",
];

export default function MobileProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedRam, setSelectedRam] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");

  // Image preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (currentPage = page) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "10",
      });

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      if (selectedBrand) {
        params.append("brand", selectedBrand);
      }

      if (selectedRam) {
        params.append("ram", selectedRam);
      }

      if (selectedStorage) {
        params.append("storage", selectedStorage);
      }

      if (selectedAvailability) {
        params.append("isAvailable", selectedAvailability);
      }

      const { data } = await api.get(
        `/seller/mobile/products?${params.toString()}`,
      );

      setProducts(data.products || []);

      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (error) {
      console.error(error);
      alert("Failed to load mobile products.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this mobile product?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/seller/mobile/products/${id}`);

      setProducts((prev) => prev.filter((product) => product._id !== id));

      alert("Mobile product deleted successfully.");
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message || "Failed to delete mobile product.",
      );
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProducts(1);
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const getDisplayPrice = (product: Product) => {
    if (product.discountPrice !== null && product.discountPrice > 0) {
      return (
        <div className="flex flex-col">
          {" "}
          <span className="line-through text-gray-400">₹{product.price} </span>
          <span className="font-semibold text-green-600">
            ₹{product.discountPrice}
          </span>
        </div>
      );
    }

    return <span>₹{product.price}</span>;
  };

  const getColorSummary = (product: Product) => {
    if (!product.colors || product.colors.length === 0) {
      return "No colors";
    }

    return product.colors.map((color) => color.name).join(", ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}{" "}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl sm:text-3xl font-bold">Mobile Products </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Manage all your mobile products.
          </p>
        </div>
        <Link
          href="/seller/mobiles/products/add"
          className="
        bg-green-600 hover:bg-green-700
        text-white px-5 py-2.5 rounded-lg
        font-medium text-center
        w-full sm:w-fit
      "
        >
          + Add Product
        </Link>
      </div>
      {/* Search and Filters */}
      <div className="bg-white border shadow rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          {/* Search */}
          <input
            type="text"
            name="searchQuery"
            placeholder="Search product, brand or variant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="
          w-full
          border
          rounded-lg
          px-4
          py-2
          focus:ring-2
          focus:ring-green-500
          outline-none
          xl:col-span-2
        "
          />

          {/* Brand */}
          {/* Brand */}
          <select
            name="brand"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="
    w-full
    border
    rounded-lg
    px-4
    py-2
    focus:ring-2
    focus:ring-green-500
    outline-none
  "
          >
            <option value="">All Brands</option>

            {MOBILE_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          {/* RAM */}
          <select
            name="ram"
            value={selectedRam}
            onChange={(e) => setSelectedRam(e.target.value)}
            className="
          w-full
          border
          rounded-lg
          px-4
          py-2
          focus:ring-2
          focus:ring-green-500
          outline-none
        "
          >
            <option value="">All RAM</option>
            <option value="2 GB">2 GB</option>
            <option value="3 GB">3 GB</option>
            <option value="4 GB">4 GB</option>
            <option value="6 GB">6 GB</option>
            <option value="8 GB">8 GB</option>
            <option value="12 GB">12 GB</option>
            <option value="16 GB">16 GB</option>
            <option value="24 GB">24 GB</option>
          </select>

          {/* Storage */}
          <select
            name="storage"
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="
          w-full
          border
          rounded-lg
          px-4
          py-2
          focus:ring-2
          focus:ring-green-500
          outline-none
        "
          >
            <option value="">All Storage</option>
            <option value="32 GB">32 GB</option>
            <option value="64 GB">64 GB</option>
            <option value="128 GB">128 GB</option>
            <option value="256 GB">256 GB</option>
            <option value="512 GB">512 GB</option>
            <option value="1 TB">1 TB</option>
            <option value="2 TB">2 TB</option>
          </select>

          {/* Availability */}
          <select
            name="availability"
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="
          w-full
          border
          rounded-lg
          px-4
          py-2
          focus:ring-2
          focus:ring-green-500
          outline-none
        "
          >
            <option value="">All Status</option>
            <option value="true">Available</option>
            <option value="false">Out of Stock</option>
          </select>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="
          w-full
          bg-green-600
          hover:bg-green-700
          text-white
          rounded-lg
          font-medium
          py-2
        "
          >
            Search
          </button>
        </div>
      </div>
      {/* Loading */}
      {loading ? (
        <div
          className="
        bg-white rounded-xl shadow border
        py-20 text-center
      "
        >
          <p className="text-gray-500">Loading mobile products...</p>
        </div>
      ) : products.length === 0 ? (
        <div
          className="
        bg-white rounded-xl shadow border
        py-16 text-center
      "
        >
          <h2 className="text-xl font-semibold">No Mobile Products Found</h2>

          <p className="text-gray-500 mt-2">
            Start by adding your first mobile product.
          </p>

          <Link
            href="/seller/mobiles/products/add"
            className="
          inline-block mt-6
          bg-green-600 hover:bg-green-700
          text-white px-6 py-3 rounded-lg
        "
          >
            Add Your First Mobile Product
          </Link>
        </div>
      ) : (
        <div
          className="
        bg-white rounded-xl shadow border
        overflow-hidden
      "
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left">Image</th>

                  <th className="px-5 py-3 text-left">Product</th>

                  <th className="px-5 py-3 text-left">Variant</th>

                  <th className="px-5 py-3 text-left">Colors</th>

                  <th className="px-5 py-3 text-left">Price</th>

                  <th className="px-5 py-3 text-left">Status</th>

                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t hover:bg-gray-50">
                    {/* Image */}
                    <td className="px-5 py-4">
                      <img
                        src={product.mainImage.url}
                        alt={product.productName}
                        onClick={() => setSelectedImage(product.mainImage.url)}
                        className="
                      w-16 h-16
                      rounded-lg
                      object-cover
                      border
                      cursor-pointer
                      hover:opacity-80
                    "
                      />
                    </td>

                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="font-medium">{product.productName}</div>

                      <div className="text-sm text-gray-500">
                        {product.brand}
                      </div>
                    </td>

                    {/* Variant */}
                    <td className="px-5 py-4">
                      <div className="font-medium">
                        {product.variantName || "—"}
                      </div>

                      <div className="text-sm text-gray-500">
                        {product.ram || "—"} / {product.storage || "—"}
                      </div>
                    </td>

                    {/* Colors */}
                    <td className="px-5 py-4 max-w-xs">
                      <span className="text-sm">
                        {getColorSummary(product)}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4">{getDisplayPrice(product)}</td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {product.isAvailable ? (
                        <span className="text-green-600 font-medium">
                          Available
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          Out of Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td
                      className="
                    px-5 py-4
                    flex flex-wrap
                    gap-2
                    justify-center
                  "
                    >
                      <Link
                        href={`/seller/mobiles/products/view/${product._id}`}
                        className="
                      bg-blue-600 hover:bg-blue-700
                      text-white px-3 py-1 rounded
                    "
                      >
                        View
                      </Link>

                      <Link
                        href={`/seller/mobiles/products/edit/${product._id}`}
                        className="
                      bg-yellow-500 hover:bg-yellow-600
                      text-white px-3 py-1 rounded
                    "
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(product._id)}
                        className="
                      bg-red-600 hover:bg-red-700
                      text-white px-3 py-1 rounded
                    "
                      >
                        Delete
                      </button>
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
                className="
              border rounded-xl
              p-4
              space-y-3
            "
              >
                <div className="flex gap-3">
                  {/* Image */}
                  <img
                    src={product.mainImage.url}
                    alt={product.productName}
                    onClick={() => setSelectedImage(product.mainImage.url)}
                    className="
                  w-20 h-20
                  rounded-lg
                  object-cover
                  border
                  cursor-pointer
                  hover:opacity-80
                  shrink-0
                "
                  />

                  <div className="min-w-0">
                    <h3 className="font-semibold">{product.productName}</h3>

                    <p className="text-sm text-gray-500">{product.brand}</p>

                    {product.variantName && (
                      <p className="text-sm mt-1">
                        Variant: {product.variantName}
                      </p>
                    )}

                    <p className="text-sm text-gray-500">
                      {product.ram || "—"} / {product.storage || "—"}
                    </p>

                    <p className="font-medium mt-1">
                      {product.discountPrice !== null &&
                      product.discountPrice > 0 ? (
                        <>
                          <span className="line-through text-gray-400 mr-2">
                            ₹{product.price}
                          </span>

                          <span className="font-semibold text-green-600">
                            ₹{product.discountPrice}
                          </span>
                        </>
                      ) : (
                        <>₹{product.price}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <span className="text-sm font-medium">Colors: </span>

                  <span className="text-sm text-gray-600">
                    {getColorSummary(product)}
                  </span>
                </div>

                {/* Status */}
                <div>
                  {product.isAvailable ? (
                    <span className="text-green-600 font-medium">
                      Available
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/seller/mobiles/products/view/${product._id}`}
                    className="
                  bg-blue-600
                  text-white
                  px-3 py-1 rounded
                "
                  >
                    View
                  </Link>

                  <Link
                    href={`/seller/mobiles/products/edit/${product._id}`}
                    className="
                  bg-yellow-500
                  text-white
                  px-3 py-1 rounded
                "
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(product._id)}
                    className="
                  bg-red-600
                  text-white
                  px-3 py-1 rounded
                "
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div
            className="
          border-t
          p-4
          flex
          flex-col sm:flex-row
          items-center
          justify-center
          gap-4
        "
          >
            {/* Previous */}
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className={`
            px-6 py-2
            rounded-lg
            font-medium
            ${
              page === 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-600 hover:bg-gray-700 text-white"
            }
          `}
            >
              Previous
            </button>

            {/* Page Info */}
            <span className="font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>

            {/* Next */}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className={`
            px-6 py-2
            rounded-lg
            font-medium
            ${
              page === totalPages
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }
          `}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {/* Image Preview */}
      {selectedImage && (
        <div
          className="
        fixed inset-0 z-50
        bg-black/80
        flex items-center justify-center
        p-4
      "
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="
          relative
          max-w-4xl
          max-h-[90vh]
        "
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="
            absolute -top-3 -right-3
            w-9 h-9
            rounded-full
            bg-white
            text-black
            text-xl
            font-bold
            shadow
            hover:bg-gray-200
          "
            >
              ×
            </button>

            <img
              src={selectedImage}
              alt="Product preview"
              className="
            max-w-full
            max-h-[90vh]
            rounded-lg
            object-contain
          "
            />
          </div>
        </div>
      )}
    </div>
  );
}
