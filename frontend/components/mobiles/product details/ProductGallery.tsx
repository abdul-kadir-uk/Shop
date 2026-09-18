// components/mobiles/product details/ProductGallery.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ProductImage = {
  url: string;
  key?: string;
};

type ProductGalleryProps = {
  product: {
    productName: string;

    mainImage: ProductImage;

    descriptionImages?: ProductImage[];
  };
};

export default function ProductGallery({ product }: ProductGalleryProps) {
  const images = useMemo(() => {
    const allImages: ProductImage[] = [];

    if (product.mainImage?.url) {
      allImages.push(product.mainImage);
    }

    if (product.descriptionImages?.length) {
      allImages.push(...product.descriptionImages);
    }

    return allImages;
  }, [product]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedImage = images[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  const handleNext = () => {
    setSelectedIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border bg-white text-gray-500">
        No image available
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* ==================================================
            MAIN IMAGE
        ================================================== */}

        <div
          className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-white"
          onClick={() => setPreviewOpen(true)}
        >
          <img
            src={selectedImage.url}
            alt={product.productName}
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
          />

          {/* Image Counter */}

          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Previous */}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Next */}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* ==================================================
            THUMBNAILS
        ================================================== */}

        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((image, index) => {
              const isSelected = selectedIndex === index;

              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                    isSelected
                      ? "border-green-600"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  aria-label={`Select image ${index + 1}`}
                >
                  <img
                    src={image.url}
                    alt={`${product.productName} ${index + 1}`}
                    className="h-full w-full object-contain p-1"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================
          FULL SCREEN IMAGE PREVIEW
      ====================================================== */}

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          {/* Close */}

          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow"
            aria-label="Close image preview"
          >
            <X size={22} />
          </button>

          {/* Previous */}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}

          <img
            src={selectedImage.url}
            alt={product.productName}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          {/* Next */}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
