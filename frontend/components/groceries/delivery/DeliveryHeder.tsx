"use client";

import { Menu } from "lucide-react";

interface DeliveryHeaderProps {
  onMenuClick: () => void;
}

export default function DeliveryHeader({ onMenuClick }: DeliveryHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Delivery Dashboard
          </h2>

          <p className="hidden text-xs text-gray-500 sm:block">
            Welcome Delivery Partner
          </p>
        </div>
      </div>
    </header>
  );
}
