// app/groceries/layout.tsx

import GroceryNavbar from "@/components/groceries/product listing/GroceryNavbar";

export default function GroceriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0">
      <GroceryNavbar />

      <main className="mx-auto w-full max-w-7xl min-w-0 px-2 py-3 sm:px-4 sm:py-5 lg:px-8">
        {children}
      </main>
    </div>
  );
}
