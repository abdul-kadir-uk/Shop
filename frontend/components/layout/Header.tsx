import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-2xl font-bold text-green-600 cursor-pointer">
            Aliauf Store
          </h1>
        </Link>

        <nav className="flex gap-6 font-medium">
          <Link href="/About" className="hover:text-green-600 transition">
            About
          </Link>

          <Link href="/contact-us" className="hover:text-green-600 transition">
            Contact-Us
          </Link>
        </nav>
      </div>
    </header>
  );
}
