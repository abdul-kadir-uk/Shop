// components/layout/ServicesSection.tsx

import ServiceCard from "./ServiceCard";
import { productCategories } from "@/data/title-card";

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Our Products</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {productCategories.map((product) => (
            <ServiceCard
              key={product.href}
              title={product.title}
              description={product.description}
              href={product.href}
              image={product.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
