// components/groceries/checkout/CheckoutCustomer.tsx

"use client";

type Customer = {
  name: string;
  email: string;
  mobile: string;
  address?: string;
};

type CheckoutCustomerProps = {
  customer: Customer;
};

export default function CheckoutCustomer({ customer }: CheckoutCustomerProps) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Customer Details
        </h2>

        <p className="mt-1 text-sm text-gray-500">Your account information.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div>
          <p className="text-xs text-gray-500">Name</p>

          <p className="mt-1 font-medium text-gray-900">{customer.name}</p>
        </div>

        {/* Mobile */}
        <div>
          <p className="text-xs text-gray-500">Mobile</p>

          <p className="mt-1 font-medium text-gray-900">{customer.mobile}</p>
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <p className="text-xs text-gray-500">Email</p>

          <p className="mt-1 break-all font-medium text-gray-900">
            {customer.email}
          </p>
        </div>
      </div>
    </section>
  );
}
