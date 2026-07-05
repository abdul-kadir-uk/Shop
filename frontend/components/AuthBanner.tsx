import Link from "next/link";

export default function AuthBanner() {
  return (
    <section className="bg-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Welcome to Aliauf Store</h2>

          <p className="text-sm text-green-100">
            Sign up or login to manage orders, save addresses and track
            deliveries.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg bg-white text-green-600 font-medium hover:bg-gray-100 transition"
          >
            Login
          </Link>

          <Link
            href="/signup/customer"
            className="px-5 py-2 rounded-lg border border-white hover:bg-green-700 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </section>
  );
}
