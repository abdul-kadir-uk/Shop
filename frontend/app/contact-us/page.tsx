import Link from "next/link";
import { ArrowRight, Handshake, Store, Truck } from "lucide-react";

export default function ContactUs() {
  return (
    <main className="min-h-screen bg-linear-to-b from-white via-slate-50 to-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Handshake className="h-4 w-4" />
              Partnership Program
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Grow With{" "}
              <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aliauf
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Join our partnership program and become a part of the Aliauf
              platform. Whether you run a shop or want to deliver orders, there
              is an opportunity for you.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Cards */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Seller */}
          <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
              <Store className="h-7 w-7 text-blue-600" />
            </div>

            <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
              Become a Seller
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              Register your business with Aliauf and reach customers through our
              platform. Showcase your products and grow your business with us.
            </p>

            <Link
              href="/signup/seller"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              Seller Registration
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Delivery */}
          <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
              <Truck className="h-7 w-7 text-purple-600" />
            </div>

            <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
              Become a Delivery Partner
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              Join our delivery network and help customers receive their orders.
              Become a delivery partner and grow with Aliauf.
            </p>

            <Link
              href="/signup/delivery"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-purple-700 sm:w-auto"
            >
              Delivery Registration
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-16 sm:px-8 lg:px-12 lg:pb-20">
        <div className="mx-auto max-w-7xl rounded-3xl bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-12 text-center text-white shadow-2xl sm:px-10 sm:py-16">
          <Handshake className="mx-auto h-9 w-9 text-blue-300" />

          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
            Let&apos;s build something together
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Choose the partnership that suits you and take the next step with
            Aliauf.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup/seller"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              Join as Seller
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/signup/delivery"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Join as Delivery Partner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
