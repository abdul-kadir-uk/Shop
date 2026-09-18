// components/mobiles/product listing/MobileFilters.tsx

"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

type Filters = {
  brand: string;
  ram: string;
  storage: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

type MobileFiltersProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

export default function MobileFilters({
  filters,
  setFilters,
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);

  const handlePriceChange = (value: string) => {
    switch (value) {
      case "below10000":
        setFilters((prev) => ({
          ...prev,
          minPrice: "",
          maxPrice: "10000",
        }));
        break;

      case "10000-20000":
        setFilters((prev) => ({
          ...prev,
          minPrice: "10000",
          maxPrice: "20000",
        }));
        break;

      case "20000-40000":
        setFilters((prev) => ({
          ...prev,
          minPrice: "20000",
          maxPrice: "40000",
        }));
        break;

      case "40000-70000":
        setFilters((prev) => ({
          ...prev,
          minPrice: "40000",
          maxPrice: "70000",
        }));
        break;

      case "above70000":
        setFilters((prev) => ({
          ...prev,
          minPrice: "70000",
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

  const selectedPrice =
    filters.minPrice === "" && filters.maxPrice === ""
      ? ""
      : filters.maxPrice === "10000"
        ? "below10000"
        : filters.minPrice === "10000" && filters.maxPrice === "20000"
          ? "10000-20000"
          : filters.minPrice === "20000" && filters.maxPrice === "40000"
            ? "20000-40000"
            : filters.minPrice === "40000" && filters.maxPrice === "70000"
              ? "40000-70000"
              : filters.minPrice === "70000"
                ? "above70000"
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
            Filter Mobiles
          </span>
        </div>

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Brand
            </label>

            <div className="relative">
              <select
                value={filters.brand}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    brand: e.target.value,
                  }))
                }
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">All Brands</option>
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="OnePlus">OnePlus</option>
                <option value="Xiaomi">Xiaomi</option>
                <option value="Vivo">Vivo</option>
                <option value="Oppo">Oppo</option>
                <option value="Realme">Realme</option>
                <option value="Motorola">Motorola</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* RAM */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              RAM
            </label>

            <div className="relative">
              <select
                value={filters.ram}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    ram: e.target.value,
                  }))
                }
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">All RAM</option>
                <option value="4 GB">4 GB</option>
                <option value="6 GB">6 GB</option>
                <option value="8 GB">8 GB</option>
                <option value="12 GB">12 GB</option>
                <option value="16 GB">16 GB</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Storage */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Storage
            </label>

            <div className="relative">
              <select
                value={filters.storage}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    storage: e.target.value,
                  }))
                }
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">All Storage</option>
                <option value="64 GB">64 GB</option>
                <option value="128 GB">128 GB</option>
                <option value="256 GB">256 GB</option>
                <option value="512 GB">512 GB</option>
                <option value="1 TB">1 TB</option>
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
                <option value="below10000">Below ₹10,000</option>
                <option value="10000-20000">₹10,000 - ₹20,000</option>
                <option value="20000-40000">₹20,000 - ₹40,000</option>
                <option value="40000-70000">₹40,000 - ₹70,000</option>
                <option value="above70000">Above ₹70,000</option>
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
