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
    <section className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex gap-2">
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
          className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />

        <button
          onClick={onSearch}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 text-sm font-medium text-white transition hover:bg-green-700"
        >
          <Search size={18} />
          Search
        </button>
      </div>
    </section>
  );
}
