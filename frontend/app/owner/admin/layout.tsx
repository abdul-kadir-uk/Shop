"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/owner/admin",
    },
    {
      name: "Customers",
      href: "/owner/admin/customers",
    },
    {
      name: "Sellers",
      href: "/owner/admin/sellers",
    },
    {
      name: "Delivery Partners",
      href: "/owner/admin/delivery",
    },
    {
      name: "Approval Requests",
      href: "/owner/admin/requests",
    },
    {
      name: "Orders",
      href: "/owner/admin/orders",
    },
    {
      name: "Revenue",
      href: "/owner/admin/revenue",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");

    router.push("/owner/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}

      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="border-b border-gray-700 px-6 py-5">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <nav className="flex-1 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-6 py-3 transition ${
                pathname === item.href ? "bg-green-600" : "hover:bg-gray-800"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-5 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}

      <div className="flex-1 flex flex-col">
        {/* Navbar */}

        <header className="bg-white shadow px-8 py-5 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            Owner Dashboard
          </h2>

          <div className="text-gray-600">Welcome, Admin</div>
        </header>

        {/* Page Content */}

        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
