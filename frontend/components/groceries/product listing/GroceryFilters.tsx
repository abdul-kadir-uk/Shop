"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

type Filters = {
  category: string;
  subCategory: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

type GroceryFiltersProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

export default function GroceryFilters({
  filters,
  setFilters,
}: GroceryFiltersProps) {
  const [open, setOpen] = useState(false);

  // Handle Price Dropdown
  const handlePriceChange = (value: string) => {
    switch (value) {
      case "below100":
        setFilters((prev) => ({
          ...prev,
          minPrice: "",
          maxPrice: "100",
        }));
        break;

      case "100-500":
        setFilters((prev) => ({
          ...prev,
          minPrice: "100",
          maxPrice: "500",
        }));
        break;

      case "500-1000":
        setFilters((prev) => ({
          ...prev,
          minPrice: "500",
          maxPrice: "1000",
        }));
        break;

      case "above1000":
        setFilters((prev) => ({
          ...prev,
          minPrice: "1000",
          maxPrice: "",
        }));
        break;

      default:
        setFilters((prev) => ({
          ...prev,
          minPrice: "",
          maxPrice: "",
        }));
    }
  };

  // Current selected price option
  const selectedPrice =
    filters.minPrice === "" && filters.maxPrice === ""
      ? ""
      : filters.maxPrice === "100"
        ? "below100"
        : filters.minPrice === "100" && filters.maxPrice === "500"
          ? "100-500"
          : filters.minPrice === "500" && filters.maxPrice === "1000"
            ? "500-1000"
            : filters.minPrice === "1000"
              ? "above1000"
              : "";

  return (
    <section className="w-full min-w-0 rounded-xl border bg-white p-2 shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between lg:pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />

          <span className="text-sm font-semibold text-gray-800">
            Filter Products
          </span>
        </div>

        {/* Toggle icon only below large */}
        <div className="lg:hidden">
          {open ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Filters */}
      <div className={`mt-3 ${open ? "block" : "hidden"} lg:block`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Category
            </label>

            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
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

              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Product Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Product Type
            </label>

            <div className="relative">
              <select
                value={filters.subCategory}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    subCategory: e.target.value,
                  }))
                }
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">All Products</option>
                <option value="open-products">Open</option>
                <option value="closed-products">Packet</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Price
            </label>

            <div className="relative">
              <select
                value={selectedPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">All Prices</option>
                <option value="below100">Below ₹100</option>
                <option value="100-500">₹100 - ₹500</option>
                <option value="500-1000">₹500 - ₹1000</option>
                <option value="above1000">Above ₹1000</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Sort By
            </label>

            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sort: e.target.value,
                  }))
                }
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="latest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_low">Lowest Price</option>
                <option value="price_high">Highest Price</option>
                <option value="discount">More Discount</option>
                <option value="name_asc">Ascending Order</option>
                <option value="name_desc">Descending Order</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
