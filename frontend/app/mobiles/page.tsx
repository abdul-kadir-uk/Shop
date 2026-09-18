// app/mobiles/page.tsx
"use client";

import { useState } from "react";

import MobileFilters from "@/components/mobiles/product listing/MobileFilters";
import MobileSearch from "@/components/mobiles/product listing/MobileSearch";
import MobileProductGrid from "@/components/mobiles/product listing/MobileProductGrid";

export default function MobilesPage() {
  // Applied filters
  const [filters, setFilters] = useState({
    brand: "",
    ram: "",
    storage: "",
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
      <div className="lg:flex">
        <div className="mr-1 mb-1 flex-3">
          <MobileFilters filters={filters} setFilters={setFilters} />
        </div>

        <div className="flex-2 w-full min-w-0">
          <MobileSearch
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onSearch={() => setSearch(searchInput.trim())}
          />
        </div>
      </div>

      <MobileProductGrid filters={filters} search={search} />
    </div>
  );
}
