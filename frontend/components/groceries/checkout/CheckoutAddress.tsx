// components/groceries/checkout/CheckoutAddress.tsx

"use client";

type City = {
  _id: string;
  name: string;
  state: string;
  deliveryCharge?: number;
};

type CheckoutAddressProps = {
  cities: City[];
  selectedCity: string;
  address: string;
  alternateMobile: string;
  onCityChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onAlternateMobileChange: (value: string) => void;
};

export default function CheckoutAddress({
  cities,
  selectedCity,
  address,
  alternateMobile,
  onCityChange,
  onAddressChange,
  onAlternateMobileChange,
}: CheckoutAddressProps) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Delivery Address
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter where you want your order delivered.
        </p>
      </div>

      <div className="space-y-4">
        {/* City */}
        <div>
          <label
            htmlFor="city"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            City
          </label>

          <select
            id="city"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          >
            <option value="">Select your city</option>

            {cities.map((city) => (
              <option key={city._id} value={city._id}>
                {city.name}, {city.state}
                {city.deliveryCharge && city.deliveryCharge > 0
                  ? ` — Delivery ₹${city.deliveryCharge}`
                  : " — Free Delivery"}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Full Delivery Address
          </label>

          <textarea
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            rows={4}
            placeholder="Enter your complete delivery address"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        {/* Alternate Mobile */}
        <div>
          <label
            htmlFor="alternateMobile"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Alternate Mobile
            <span className="ml-1 font-normal text-gray-400">(Optional)</span>
          </label>

          <input
            id="alternateMobile"
            type="tel"
            value={alternateMobile}
            onChange={(e) => onAlternateMobileChange(e.target.value)}
            placeholder="Enter alternate mobile number"
            maxLength={15}
            className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />

          <p className="mt-1.5 text-xs text-gray-400">
            Provide another number if we need to contact you during delivery.
          </p>
        </div>
      </div>
    </section>
  );
}
