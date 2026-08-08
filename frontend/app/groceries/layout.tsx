// app/groceries/layout.tsx

import GroceryNavbar from "@/components/groceries/GroceryNavbar";

export default function GroceriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <GroceryNavbar />

      <main className="mx-auto max-w-7xl px-3 py-4 sm:py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
