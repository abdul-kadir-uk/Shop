// app/seller/grocery/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Product {
  _id: string;
  productName: string;
  productCategory: string;
  price: number;
  quantity: number;
  unit: string;
  stock: number;
  isAvailable: boolean;
  mainImage: {
    url: string;
  };
}

export default function GroceryProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (currentPage = page) => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/seller/grocery/products?page=${currentPage}&limit=10&search=${encodeURIComponent(
          searchQuery,
        )}&category=${encodeURIComponent(
          selectedCategory,
        )}&subCategory=${encodeURIComponent(selectedSubCategory)}`,
      );

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
      alert("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/seller/grocery/products/${id}`);

      setProducts((prev) => prev.filter((product) => product._id !== id));

      alert("Product deleted successfully.");
    } catch (error: any) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to delete product.");
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProducts(1);
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>

          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Manage all your grocery products.
          </p>
        </div>

        <Link
          href="/seller/grocery/products/add"
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

      {/* Search Bar */}
      <div className="bg-white border shadow rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Search */}

          <input
            type="text"
            placeholder="Search by product name or brand..."
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
      "
          />

          {/* Category */}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            <option value="">All Categories</option>

            <option value="Rice">Rice</option>

            <option value="Flour">Flour</option>

            <option value="Oil">Oil</option>

            <option value="Vegetables">Vegetables</option>

            <option value="Fruits">Fruits</option>

            <option value="Milk">Milk</option>

            <option value="Beverages">Beverages</option>

            <option value="Snacks">Snacks</option>

            <option value="Cleaning">Cleaning</option>

            <option value="Personal Care">Personal Care</option>

            <option value="Others">Others</option>
          </select>

          {/* Sub Category */}

          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
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
            <option value="">All Product Types</option>

            <option value="open-products">Open Products</option>

            <option value="closed-products">Closed Products</option>
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
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div
          className="
        bg-white rounded-xl shadow border
        py-16 text-center
        "
        >
          <h2 className="text-xl font-semibold">No Products Found</h2>

          <p className="text-gray-500 mt-2">
            Start by adding your first grocery product.
          </p>

          <Link
            href="/seller/grocery/products/add"
            className="
            inline-block mt-6
            bg-green-600 hover:bg-green-700
            text-white px-6 py-3 rounded-lg
            "
          >
            Add Your First Product
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

                  <th className="px-5 py-3 text-left">Category</th>

                  <th className="px-5 py-3 text-left">Price</th>

                  <th className="px-5 py-3 text-left">Stock</th>

                  <th className="px-5 py-3 text-left">Status</th>

                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <img
                        src={product.mainImage.url}
                        alt={product.productName}
                        className="
                    w-16 h-16
                    rounded-lg
                    object-cover
                    border
                    "
                      />
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {product.productName}
                    </td>

                    <td className="px-5 py-4">{product.productCategory}</td>

                    <td className="px-5 py-4">₹{product.price}</td>

                    <td className="px-5 py-4">
                      {product.stock}
                      <br />
                      <span className="text-sm text-gray-500">
                        ({product.quantity} {product.unit})
                      </span>
                    </td>

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

                    <td
                      className="
                  px-5 py-4
                  flex flex-wrap
                  gap-2
                  justify-center
                  "
                    >
                      <Link
                        href={`/seller/grocery/products/view/${product._id}`}
                        className="
                    bg-blue-600 hover:bg-blue-700
                    text-white px-3 py-1 rounded
                    "
                      >
                        View
                      </Link>

                      <Link
                        href={`/seller/grocery/products/edit/${product._id}`}
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
                  <img
                    src={product.mainImage.url}
                    alt={product.productName}
                    className="
                w-20 h-20
                rounded-lg
                object-cover
                border
                "
                  />

                  <div>
                    <h3 className="font-semibold">{product.productName}</h3>

                    <p className="text-sm text-gray-500">
                      {product.productCategory}
                    </p>

                    <p className="font-medium mt-1">₹{product.price}</p>
                  </div>
                </div>

                <div className="text-sm">
                  Stock: {product.stock} ({product.quantity} {product.unit})
                </div>

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

                <div
                  className="
              flex flex-wrap gap-2
              "
                >
                  <Link
                    href={`/seller/grocery/products/view/${product._id}`}
                    className="
                bg-blue-600 text-white
                px-3 py-1 rounded
                "
                  >
                    View
                  </Link>

                  <Link
                    href={`/seller/grocery/products/edit/${product._id}`}
                    className="
                bg-yellow-500 text-white
                px-3 py-1 rounded
                "
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(product._id)}
                    className="
                bg-red-600 text-white
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
    </div>
  );
}
