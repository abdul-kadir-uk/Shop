"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    href: "/seller/medicine",
  },
  {
    title: "Products",
    href: "/seller/medicine/products",
  },
  {
    title: "Add Product",
    href: "/seller/medicine/products/add",
  },
  {
    title: "Orders",
    href: "/seller/medicine/orders",
  },
  {
    title: "Sells",
    href: "/seller/medicine/sells",
  },
  {
    title: "Profile",
    href: "/seller/medicine/profile",
  },
];

interface Props {
  closeSidebar?: () => void;
}

export default function MedicineSidebar({ closeSidebar }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-full h-screen bg-white border-r shadow-sm flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-blue-600">Medicine Seller</h2>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`block rounded-lg px-4 py-3 font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
