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
      <div className="text-blue-700 text-right text-sm">
        <span>Grocery Delivery Timings: 9:00 AM to 9:00 PM.</span>
        <span className="hidden lg:inline">
          Orders placed after 9:00 PM will be delivered the next day after 9:00
          AM.
        </span>
      </div>
      <main className="mx-auto w-full max-w-7xl min-w-0 px-2 py-3 sm:px-4 sm:py-5 lg:px-8">
        {children}
      </main>
    </div>
  );
}
