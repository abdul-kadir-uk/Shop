import ServiceCard from "./ServiceCard";

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <ServiceCard
            title="Groceries"
            description="All groceries Product that you need."
            href="/groceries"
            image="/images/groceries.jpg"
          />
        </div>
      </div>
    </section>
  );
}
