"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

type Filters = {
  category: string;
  subCategory: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

type GroceryCategoriesProps = {
  filters: Filters;
};

const categories = [
  "Rice and Grains",
  "flour and staples",
  "Pulses",
  "Spices",
  "Oil",
  "Dry Fruits",
  "Tea, Coffee and Beverages",
  "Sugar, Salt and Pickles",
  "Personal & Household Care",
  "Dairy Products",
];

export default function GroceryCategories({ filters }: GroceryCategoriesProps) {
  const router = useRouter();

  const [showAll, setShowAll] = useState(false);

  const visibleCategories = showAll ? categories : categories.slice(0, 6);

  const handleCategoryClick = (category: string) => {
    router.push(`/groceries?category=${encodeURIComponent(category)}`);
  };

  return (
    <section className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">
          Grocery Categories
        </h2>

        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
        >
          {showAll ? "Show Less" : "See All Categories"}

          {showAll ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleCategories.map((category) => {
          const isActive = filters.category === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryClick(category)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
}
