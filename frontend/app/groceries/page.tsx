"use client";

import { useState } from "react";
import GroceryFilters from "@/components/groceries/GroceryFilters";
import GrocerySearch from "@/components/groceries/GrocerySearch";
import ProductGrid from "@/components/groceries/ProductGrid";

export default function GroceriesPage() {
  // Applied filters
  const [filters, setFilters] = useState({
    category: "",
    subCategory: "",
    minPrice: "",
    maxPrice: "",
    sort: "latest",
  });

  // Search input
  const [searchInput, setSearchInput] = useState("");

  // Applied search
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-3">
      <div className="md:flex">
        <div className="mr-1 mb-1 flex-2">
          <GroceryFilters filters={filters} setFilters={setFilters} />
        </div>

        <div className="flex-2">
          <GrocerySearch
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onSearch={() => setSearch(searchInput.trim())}
          />
        </div>
      </div>

      <ProductGrid filters={filters} search={search} />
    </div>
  );
}
