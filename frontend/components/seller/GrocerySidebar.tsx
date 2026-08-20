"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    href: "/seller/grocery",
  },
  {
    title: "Products",
    href: "/seller/grocery/products",
  },
  {
    title: "Add Product",
    href: "/seller/grocery/products/add",
  },
  {
    title: "Orders",
    href: "/seller/grocery/orders",
  },
  {
    title: "Sells",
    href: "/seller/grocery/sells",
  },
  {
    title: "Profile",
    href: "/seller/grocery/profile",
  },
];

interface Props {
  closeSidebar?: () => void;
}

export default function GrocerySidebar({ closeSidebar }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-full h-screen bg-white border-r shadow-sm flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-green-600">Grocery Seller</h2>
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
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-700"
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
