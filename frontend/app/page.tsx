import Header from "@/components/Header";
import AuthBanner from "@/components/AuthBanner";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import Footer from "@/components/Footer";

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
