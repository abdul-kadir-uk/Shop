"use client";

import { Search } from "lucide-react";

type GrocerySearchProps = {
  searchInput: string;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  onSearch: () => void;
};

export default function GrocerySearch({
  searchInput,
  setSearchInput,
  onSearch,
}: GrocerySearchProps) {
  return (
    <section className="w-full min-w-0">
      <div className="flex w-full min-w-0 flex-nowrap items-center gap-2">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search groceries..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />

        {/* Search Button */}
        <button
          type="button"
          onClick={onSearch}
          className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 text-sm font-medium text-white transition hover:bg-green-700 sm:gap-2 sm:px-5"
        >
          <Search size={17} />
          <span>Search</span>
        </button>
      </div>
    </section>
  );
}
