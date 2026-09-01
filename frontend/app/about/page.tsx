"use client";

import {
  ArrowRight,
  CheckCircle2,
  Heart,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import Link from "next/link";

const AboutPage = () => {
  return (
    <main className="min-h-screen bg-linear-to-b from-white via-slate-50 to-white text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-100/60 blur-3xl" />

        <div className="relative mx-auto flex min-h-130 max-w-7xl items-center px-5 py-16 sm:px-8 lg:px-12">
          <div className="grid w-full items-center gap-14 lg:grid-cols-2">
            {/* Left */}
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                <Sparkles className="h-4 w-4" />
                Welcome to Aliauf
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Everything You Need,
                <span className="block bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Right at Your Doorstep
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg lg:mx-0">
                Aliauf.com is your convenient destination for discovering
                quality products and useful services from the comfort of your
                home.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Explore Our Services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right visual */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60 sm:p-7">
                <div className="rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 p-7 text-white sm:p-10">
                  <ShoppingBag className="mb-8 h-12 w-12" />

                  <p className="text-sm font-medium text-blue-100">
                    ALIAUF.COM
                  </p>

                  <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                    Simple.
                    <br />
                    Convenient.
                    <br />
                    Reliable.
                  </h2>

                  <div className="mt-8 h-1 w-16 rounded-full bg-white/70" />

                  <p className="mt-5 text-sm leading-6 text-blue-100">
                    Explore products and services designed to make everyday
                    shopping easier.
                  </p>
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-5 -left-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:-left-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Easy Shopping
                    </p>
                    <p className="text-xs text-slate-500">
                      From anywhere, anytime
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              About Aliauf
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Making everyday shopping simpler
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              We believe shopping should be simple, convenient, and accessible.
              Aliauf.com brings products and services together in one place so
              you can explore what you need without unnecessary hassle.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Why Aliauf
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Built around your convenience
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 transition group-hover:scale-105">
              <ShoppingBag className="h-7 w-7 text-blue-600" />
            </div>

            <h3 className="mt-6 text-xl font-bold">Explore Products</h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Discover a growing selection of products designed to meet your
              everyday needs.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 transition group-hover:scale-105">
              <Truck className="h-7 w-7 text-purple-600" />
            </div>

            <h3 className="mt-6 text-xl font-bold">At Your Doorstep</h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enjoy a convenient shopping experience and get your orders
              delivered without unnecessary effort.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:col-span-2 lg:col-span-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 transition group-hover:scale-105">
              <Heart className="h-7 w-7 text-pink-600" />
            </div>

            <h3 className="mt-6 text-xl font-bold">Customer Focused</h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              We aim to create a smooth and enjoyable experience for every
              customer who shops with Aliauf.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-16 sm:px-8 lg:px-12 lg:pb-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-12 text-center text-white shadow-2xl sm:px-10 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <Sparkles className="mx-auto h-8 w-8 text-blue-300" />

            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              Ready to explore Aliauf?
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
              Discover products and services that make your everyday life a
              little easier.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Start Exploring
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
