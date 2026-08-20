"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, User, X, Truck, Wallet } from "lucide-react";

interface DeliverySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/delivery/grocery",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/delivery/grocery/orders",
    icon: Package,
  },

  {
    label: "Earnings",
    href: "/delivery/grocery/earnings",
    icon: Wallet,
  },
  {
    label: "Profile",
    href: "/delivery/grocery/profile",
    icon: User,
  },
];

export default function DeliverySidebar({
  isOpen,
  onClose,
}: DeliverySidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-white shadow-sm transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link
            href="/delivery/grocery"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
              <Truck size={21} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">Delivery</h1>
              <p className="text-xs text-gray-500">Partner Panel</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/delivery/grocery"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t p-4">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              Delivery Partner
            </p>
            <p className="mt-1 text-xs text-green-700">
              Manage your deliveries from here.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
