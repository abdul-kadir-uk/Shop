"use client";

type OrderStatusProps = {
  status: string;
};

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  ordered: {
    label: "Order Placed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },

  confirmed: {
    label: "Confirmed",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },

  notAvailable: {
    label: "Not Available",
    className: "bg-red-50 text-red-700 border-red-200",
  },

  outForDelivery: {
    label: "Out for Delivery",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },

  delivered: {
    label: "Delivered",
    className: "bg-green-50 text-green-700 border-green-200",
  },

  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export default function OrderStatus({ status }: OrderStatusProps) {
  const config = statusConfig[status] || {
    label: status
      ? status
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase())
      : "Unknown",

    className: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
