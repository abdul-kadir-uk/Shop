// app/page.tsx
import Header from "@/components/layout/Header";
import AuthBanner from "@/components/layout/AuthBanner";
import Hero from "@/components/layout/Hero";
import ServicesSection from "@/components/layout/ServicesSection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <AuthBanner />
        <Hero />
        <ServicesSection />
      </main>

      <Footer />
    </div>
  );
}
