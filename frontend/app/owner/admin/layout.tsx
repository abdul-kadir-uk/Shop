"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.replace("/owner/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("admin");

          router.replace("/owner/login");
          return;
        }

        setCheckingAuth(false);
      } catch (error) {
        console.error(error);

        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        router.replace("/owner/login");
      }
    };

    verifyAdmin();
  }, [router]);

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

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");

    try {
      if (token) {
        await fetch("http://localhost:5000/api/admin/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    router.replace("/owner/login");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h2 className="text-lg md:text-xl font-semibold">
          Verifying Authentication...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Overlay */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen
          w-64
          bg-gray-900
          text-white
          flex
          flex-col
          transform
          transition-transform
          duration-300
          ease-in-out

          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}

          lg:translate-x-0
          lg:static
          lg:flex
        `}
      >
        {/* Logo */}

        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-5">
          <h1 className="text-2xl font-bold">Admin Panel</h1>

          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* Menu */}

        <nav className="flex-1 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`block px-6 py-3 transition ${
                pathname === item.href ? "bg-green-600" : "hover:bg-gray-800"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Logout */}

        <div className="border-t border-gray-700 p-5">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 transition py-2 rounded-lg font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}

      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}

        <header className="sticky top-0 z-30 bg-white shadow-sm border-b px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={26} />
            </button>

            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              Owner Dashboard
            </h2>
          </div>

          <div className="hidden sm:block text-gray-600 font-medium">
            Welcome, Admin
          </div>
        </header>

        {/* Content */}

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
