// components/groceries/checkout/CheckoutPayment.tsx

"use client";

import { Banknote } from "lucide-react";

type CheckoutPaymentProps = {
  selectedPayment: "COD";
  onPaymentChange: (value: "COD") => void;
};

export default function CheckoutPayment({
  selectedPayment,
  onPaymentChange,
}: CheckoutPaymentProps) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Payment Method
      </h2>

      <button
        type="button"
        onClick={() => onPaymentChange("COD")}
        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
          selectedPayment === "COD"
            ? "border-green-600 bg-green-50"
            : "border-gray-200 hover:border-green-400"
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Banknote size={20} />
        </div>

        <div>
          <p className="font-semibold text-gray-900">Cash On Delivery</p>

          <p className="text-sm text-gray-500">
            Pay when your order is delivered
          </p>
        </div>

        <div className="ml-auto">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
              selectedPayment === "COD" ? "border-green-600" : "border-gray-400"
            }`}
          >
            {selectedPayment === "COD" && (
              <div className="h-2.5 w-2.5 rounded-full bg-green-600" />
            )}
          </div>
        </div>
      </button>
    </section>
  );
}
