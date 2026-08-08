import ServiceCard from "./ServiceCard";

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <ServiceCard
            title="Groceries"
            description="Fresh vegetables, fruits, dairy products, snacks and daily essentials."
            href="/groceries"
            image="/images/groceries.jpg"
          />

          <ServiceCard
            title="Mobile Repair"
            description="Screen replacement, battery repair, software troubleshooting and complete servicing."
            href="/mobile-repair"
            image="/images/mobile-repair.jpg"
          />
        </div>
      </div>
    </section>
  );
}
