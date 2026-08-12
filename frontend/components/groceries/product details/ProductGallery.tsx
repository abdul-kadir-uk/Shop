"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type ImageType = {
  url: string;
};

type ProductGalleryProps = {
  product: {
    productName: string;
    mainImage: ImageType;
    descriptionImages: ImageType[];
  };
};

export default function ProductGallery({ product }: ProductGalleryProps) {
  // Combine main image + description images
  const images = useMemo(() => {
    const list = [];

    if (product.mainImage?.url) {
      list.push(product.mainImage);
    }

    if (product.descriptionImages?.length) {
      list.push(...product.descriptionImages);
    }

    return list;
  }, [product]);

  const [selectedImage, setSelectedImage] = useState(images[0]?.url || "");

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
        <Image
          src={selectedImage}
          alt={product.productName}
          loading="eager"
          fill
          priority
          className="object-contain p-4"
          sizes="(max-width:768px)100vw,50vw"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image.url)}
              className={`relative aspect-square overflow-hidden rounded-lg border transition
                ${
                  selectedImage === image.url
                    ? "border-green-600 ring-2 ring-green-200"
                    : "border-gray-200"
                }`}
            >
              <Image
                src={image.url}
                alt={`${product.productName}-${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
