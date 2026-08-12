"use client";

import { MapPin, Phone, CreditCard, IndianRupee } from "lucide-react";

type OrderDetailsProps = {
  shippingAddress: {
    address: string;
    city: {
      _id: string;
      name: string;
      state: string;
    };
  };

  deliveryContact: {
    primaryMobile: string;
    alternateMobile?: string;
  };

  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  };

  paymentMethod: string;
  paymentStatus: string;
};

export default function OrderDetails({
  shippingAddress,
  deliveryContact,
  pricing,
  paymentMethod,
  paymentStatus,
}: OrderDetailsProps) {
  return (
    <div className="space-y-5">
      {/* Delivery Address */}
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-green-600" />

          <h2 className="text-lg font-semibold text-gray-900">
            Delivery Address
          </h2>
        </div>

        <p className="leading-6 text-gray-700">{shippingAddress.address}</p>

        <p className="mt-2 font-medium text-gray-900">
          {shippingAddress.city.name}, {shippingAddress.city.state}
        </p>
      </section>

      {/* Contact */}
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Phone size={20} className="text-green-600" />

          <h2 className="text-lg font-semibold text-gray-900">
            Delivery Contact
          </h2>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Primary Mobile</span>

            <span className="font-medium text-gray-900">
              {deliveryContact.primaryMobile}
            </span>
          </div>

          {deliveryContact.alternateMobile && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Alternate Mobile</span>

              <span className="font-medium text-gray-900">
                {deliveryContact.alternateMobile}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Payment */}
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-green-600" />

          <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              {paymentMethod === "COD" ? "Cash On Delivery" : paymentMethod}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Payment status:{" "}
              <span className="font-medium capitalize">{paymentStatus}</span>
            </p>
          </div>

          <IndianRupee size={22} className="text-green-600" />
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Payment Summary
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>

            <span className="font-medium">₹{pricing.subtotal}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Discount</span>

            <span className="font-medium text-green-600">
              -₹{pricing.discount}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Charge</span>

            <span className="font-medium">
              {pricing.deliveryCharge > 0
                ? `₹${pricing.deliveryCharge}`
                : "Free"}
            </span>
          </div>

          <div className="flex justify-between border-t pt-3 text-base">
            <span className="font-semibold">Total</span>

            <span className="text-xl font-bold text-green-600">
              ₹{pricing.total}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
