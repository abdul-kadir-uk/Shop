// components/seller/ProductForm.tsx
"use client";

import { useState } from "react";

interface ProductFormProps {
  initialData?: {
    productName: string;
    productCategory: string;
    productSubCategory: string;
    description: string;
    stock: number | string;
    brand: string;
    price: number | string;
    discountPrice: number | string;
    quantity: number | string;
    unit: string;
    isAvailable: boolean;
    images?: string[];
    variants?: Variant[];
  };
  existingMainImage?: string;
  existingDescriptionImages?: {
    key: string;
    url: string;
  }[];
  onRemoveExistingDescriptionImage?: (key: string) => void;
  onSubmit: (
    data: any,
    mainImage: File | null,
    descriptionImages: File[],
  ) => void;
  loading?: boolean;
}

interface Variant {
  quantity: number | string;
  unit: string;

  price: number | string;
  discountPrice: number | string;

  stock: number | string;

  isDefault: boolean;
}

export default function ProductForm({
  initialData,
  onSubmit,
  loading = false,
  existingMainImage,
  existingDescriptionImages = [],
  onRemoveExistingDescriptionImage,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    productName: initialData?.productName || "",
    description: initialData?.description || "",
    brand: initialData?.brand || "",

    productCategory: initialData?.productCategory || "",
    productSubCategory: initialData?.productSubCategory || "",

    price: initialData?.price || "",
    discountPrice: initialData?.discountPrice || "",

    quantity: initialData?.quantity || "",
    unit: initialData?.unit || "kg",

    stock: initialData?.stock || "",

    isAvailable: initialData?.isAvailable ?? true,
  });

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [descriptionImages, setDescriptionImages] = useState<File[]>([]);
  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants || [],
  );
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate image type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    // Validate max size (10MB)
    const MAX_SIZE = 20 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      alert("Main image must be less than 10MB.");
      return;
    }

    setMainImage(file);
  };

  const handleDescriptionImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    if (files.length > 4) {
      alert("Maximum 4 description images allowed.");
      return;
    }

    const MAX_SIZE = 20 * 1024 * 1024;

    for (const file of files) {
      // Validate image type
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not a valid image.`);
        return;
      }

      // Validate file size
      if (file.size > MAX_SIZE) {
        alert(`${file.name} must be less than 10MB.`);
        return;
      }
    }

    setDescriptionImages(files);
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        quantity: "",
        unit: "g",

        price: "",
        discountPrice: "",

        stock: "",

        isDefault: prev.length === 0,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]: value,
            }
          : variant,
      ),
    );
  };

  const setDefaultVariant = (index: number) => {
    setVariants((prev) =>
      prev.map((variant, i) => ({
        ...variant,
        isDefault: i === index,
      })),
    );
  };

  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        ...formData,
        variants: variants.map((variant) => ({
          quantity: Number(variant.quantity),

          unit: variant.unit,

          price: Number(variant.price),

          discountPrice:
            variant.discountPrice === "" ? null : Number(variant.discountPrice),

          stock: Number(variant.stock),

          isDefault: variant.isDefault,
        })),
      },
      mainImage,
      descriptionImages,
    );
  };

  return (
    <form onSubmit={submitHandler} className="space-y-8">
      {/* Product Name */}

      <div>
        <label className="block font-semibold mb-2">Product Name</label>

        <input
          type="text"
          name="productName"
          required
          value={formData.productName}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />
      </div>

      {/* Description */}

      <div>
        <label className="block font-semibold mb-2">
          Description <span className="text-gray-500">(Optional)</span>
        </label>

        <textarea
          rows={5}
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />
      </div>

      {/* Category + Brand */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-semibold mb-2">Category</label>

          <select
            name="productCategory"
            value={formData.productCategory}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-3"
          >
            <option value="">Select Category</option>

            <option value="Rice and Grains"> Rice </option>
            <option> flour and staples </option>
            <option> Pulses </option>
            <option> Spices </option>
            <option> Oil </option>
            <option> Dry Fruits </option>
            <option> Tea, Coffee and Beverages </option>
            <option> Sugar, Salt and Pickles </option>
            <option> Personal & Household Care </option>
            <option> Dairy Products </option>
            <option> Cold Drinks </option>
            <option> Chips, Namkeen and Snacks </option>
            <option> Choclates </option>
            <option> Biscuits </option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2">Product Type</label>

          <select
            name="productSubCategory"
            value={formData.productSubCategory}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-3"
          >
            <option value="">Select Type</option>

            <option value="open-products">Open Products</option>

            <option value="closed-products">Packet Products</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Brand <span className="text-gray-500">(Optional)</span>
          </label>

          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />
        </div>
      </div>

      {/* Price */}
      {variants.length === 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-2">Price</label>

              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Discount Price
                <span className="text-gray-500">(Optional)</span>
              </label>

              <input
                type="number"
                name="discountPrice"
                value={formData.discountPrice}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>
        </>
      )}

      {/* Quantity */}
      {variants.length === 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-2">Quantity</label>

              <input
                type="number"
                name="quantity"
                required
                value={formData.quantity}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Stock
                <span className="text-gray-500">(Optional)</span>
              </label>

              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Unit</label>

              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              >
                <option>kg</option>
                <option>g</option>
                <option>litre</option>
                <option>ml</option>
                <option>piece</option>
                <option>packet</option>
                <option>box</option>
                <option value="mg">mg</option>
                <option value="dozen">Dozen</option>
                <option value="bundle">Bundle</option>
              </select>
            </div>
          </div>
        </>
      )}

      <div className="border rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Product Variants</h2>

            <p className="text-sm text-gray-500">
              Optional. Leave empty if this product has only one size.
            </p>
          </div>

          <button
            type="button"
            onClick={addVariant}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            + Add Variant
          </button>
        </div>

        {variants.length === 0 && (
          <div className="text-gray-500 text-sm">No variants added.</div>
        )}

        {variants.map((variant, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-4 bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Variant #{index + 1}</h3>

              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Quantity</label>

                <input
                  type="number"
                  min="0"
                  value={variant.quantity}
                  onChange={(e) =>
                    updateVariant(index, "quantity", e.target.value)
                  }
                  className="w-full border rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Unit</label>

                <select
                  value={variant.unit}
                  onChange={(e) => updateVariant(index, "unit", e.target.value)}
                  className="w-full border rounded-lg p-3"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="mg">mg</option>
                  <option value="ml">ml</option>
                  <option value="litre">litre</option>
                  <option value="piece">piece</option>
                  <option value="packet">packet</option>
                  <option value="box">box</option>
                  <option value="dozen">dozen</option>
                  <option value="bundle">bundle</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Price</label>

                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(index, "price", e.target.value)
                  }
                  className="w-full border rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Discount Price</label>

                <input
                  type="number"
                  value={variant.discountPrice}
                  onChange={(e) =>
                    updateVariant(index, "discountPrice", e.target.value)
                  }
                  className="w-full border rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Stock</label>

                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(index, "stock", e.target.value)
                  }
                  className="w-full border rounded-lg p-3"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={variant.isDefault}
                onChange={() => setDefaultVariant(index)}
              />

              <span>Default Variant</span>
            </div>
          </div>
        ))}
      </div>

      {/* Images */}

      {/* Main Image */}

      <div>
        <label className="block font-semibold mb-2">Upload Main Image</label>

        <input
          type="file"
          required={!initialData}
          accept="image/*"
          onChange={handleMainImageChange}
          className="w-full border rounded-lg p-3"
        />

        {existingMainImage && !mainImage && (
          <div className="mb-4">
            <img
              src={existingMainImage}
              alt="Current Main"
              className="w-40 h-40 rounded-lg object-cover border"
            />
          </div>
        )}

        {mainImage && (
          <div className="mt-4">
            <img
              src={URL.createObjectURL(mainImage)}
              alt="Main Preview"
              className="w-40 h-40 rounded-lg object-cover border"
            />
          </div>
        )}
      </div>

      {/* Description Images */}

      <div>
        <label className="block font-semibold mb-2">
          Upload Upto 4 Description Images{" "}
          <span className="text-gray-500 text-sm font-normal">(Optional)</span>
        </label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleDescriptionImagesChange}
          className="w-full border rounded-lg p-3"
        />

        {existingDescriptionImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {existingDescriptionImages.map((image) => (
              <div key={image.key} className="relative">
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-28 rounded-lg object-cover border"
                />

                <button
                  type="button"
                  onClick={() => onRemoveExistingDescriptionImage?.(image.key)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {descriptionImages.map((image, index) => (
            <img
              key={index}
              src={URL.createObjectURL(image)}
              alt={`Description ${index + 1}`}
              className="w-full h-28 rounded-lg object-cover border"
            />
          ))}
        </div>
      </div>

      {/* Availability */}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isAvailable"
          checked={formData.isAvailable}
          onChange={handleChange}
        />

        <label>Product Available</label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
}
