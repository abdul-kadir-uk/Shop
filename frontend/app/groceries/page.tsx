"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GroceryCategories from "@/components/groceries/product listing/GroceryCategories";
import GroceryFilters from "@/components/groceries/product listing/GroceryFilters";
import GrocerySearch from "@/components/groceries/product listing/GrocerySearch";
import GroceryCategoryProducts from "@/components/groceries/product listing/GroceryCategoryProducts";
import ProductGrid from "@/components/groceries/product listing/ProductGrid";

export default function GroceriesPage() {
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";

  const [filters, setFilters] = useState({
    category: "",
    subCategory: "",
    minPrice: "",
    maxPrice: "",
    sort: "latest",
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: selectedCategory,
    }));
  }, [selectedCategory]);

  return (
    <div className="space-y-3">
      {/* Filters + Search */}
      <div className="lg:flex">
        <div className="mr-1 mb-1 flex-3">
          <GroceryFilters filters={filters} setFilters={setFilters} />
        </div>

        <div className="flex-2 w-full min-w-0">
          <GrocerySearch
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onSearch={() => setSearch(searchInput.trim())}
          />
        </div>
      </div>

      {/* Category Names */}
      <GroceryCategories filters={filters} />

      {/* 
        Show category-wise preview sections ONLY on the
        normal groceries page.

        When a category is selected through "See All",
        these sections disappear.
      */}
      {!selectedCategory && <GroceryCategoryProducts />}

      {/* Main Product Grid */}
      <ProductGrid filters={filters} search={search} />
    </div>
  );
}
