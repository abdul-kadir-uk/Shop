import Link from "next/link";
import Image from "next/image";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  image: string;
}

export default function ServiceCard({
  title,
  description,
  href,
  image,
}: ServiceCardProps) {
  return (
    <Link href={href}>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer">
        <div className="relative h-60 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition duration-500"
          />
        </div>

        <div className="p-6">
          <h3 className="text-2xl font-bold mb-3">{title}</h3>

          <p className="text-gray-600 mb-4">{description}</p>

          <span className="text-green-600 font-semibold">Explore →</span>
        </div>
      </div>
    </Link>
  );
}
