// app/mobiles/layout.tsx

import MobileNavbar from "@/components/mobiles/product listing/MobileNavbar";

export default function MobilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0">
      <MobileNavbar />

      <main className="mx-auto w-full max-w-7xl min-w-0 px-2 py-3 sm:px-4 sm:py-5 lg:px-8">
        {children}
      </main>
    </div>
  );
}
