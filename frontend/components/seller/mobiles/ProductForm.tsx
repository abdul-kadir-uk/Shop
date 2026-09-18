// components/seller/mobiles/ProductForm.tsx
"use client";

import { useEffect, useState } from "react";

const MOBILE_BRANDS = [
  "Apple",
  "Samsung",
  "OnePlus",
  "Xiaomi",
  "Redmi",
  "Realme",
  "Vivo",
  "Oppo",
  "Motorola",
  "Google",
  "Nothing",
  "iQOO",
  "Poco",
  "Honor",
  "Nokia",
];

const RAM_OPTIONS = [
  "2 GB",
  "3 GB",
  "4 GB",
  "6 GB",
  "8 GB",
  "12 GB",
  "16 GB",
  "24 GB",
];

const STORAGE_OPTIONS = [
  "32 GB",
  "64 GB",
  "128 GB",
  "256 GB",
  "512 GB",
  "1 TB",
  "2 TB",
];

interface ProductColor {
  name: string;
  isAvailable: boolean;
  price: string | number | null;
}

interface CameraData {
  front: string;
  rear: string;
}

interface ProductFormData {
  productName: string;
  brand: string;
  description: string;
  variantName: string;
  variantGroupId: string;
  ram: string;
  storage: string;
  processor: string;
  display: string;
  camera: CameraData;
  battery: string;
  operatingSystem: string;
  warranty: string;
  charging: string;
  colors: ProductColor[];
  price: string | number;
  discountPrice: string | number;
  isAvailable: boolean;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;

  existingMainImage?: string;

  existingDescriptionImages?: {
    key: string;
    url: string;
  }[];

  onRemoveExistingDescriptionImage?: (key: string) => void;

  onSubmit: (
    data: ProductFormData,
    mainImage: File | null,
    descriptionImages: File[],
  ) => void;

  loading?: boolean;
}

const MAX_DESCRIPTION_IMAGES = 6;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function ProductForm({
  initialData,
  existingMainImage,
  existingDescriptionImages = [],
  onRemoveExistingDescriptionImage,
  onSubmit,
  loading = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    productName: initialData?.productName || "",
    brand: initialData?.brand || "",
    description: initialData?.description || "",
    variantName: initialData?.variantName || "",
    variantGroupId: initialData?.variantGroupId || "",
    ram: initialData?.ram || "",
    storage: initialData?.storage || "",
    processor: initialData?.processor || "",
    display: initialData?.display || "",

    camera: {
      front: initialData?.camera?.front || "",
      rear: initialData?.camera?.rear || "",
    },

    battery: initialData?.battery || "",
    operatingSystem: initialData?.operatingSystem || "",
    warranty: initialData?.warranty || "",
    charging: initialData?.charging || "",
    colors: initialData?.colors || [],
    price: initialData?.price ?? "",
    discountPrice: initialData?.discountPrice ?? "",
    isAvailable: initialData?.isAvailable ?? true,
  });

  const [mainImage, setMainImage] = useState<File | null>(null);

  const [descriptionImages, setDescriptionImages] = useState<File[]>([]);

  /* =========================================================
      IMAGE PREVIEWS
  ========================================================= */

  const [mainImagePreview, setMainImagePreview] = useState<string | null>(
    existingMainImage || null,
  );

  const [descriptionImagePreviews, setDescriptionImagePreviews] = useState<
    string[]
  >([]);

  /* =========================================================
      MAIN IMAGE PREVIEW
  ========================================================= */

  useEffect(() => {
    if (!mainImage) {
      setMainImagePreview(existingMainImage || null);
      return;
    }

    const objectUrl = URL.createObjectURL(mainImage);

    setMainImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [mainImage, existingMainImage]);

  /* =========================================================
      DESCRIPTION IMAGE PREVIEWS
  ========================================================= */

  useEffect(() => {
    const urls = descriptionImages.map((image) => URL.createObjectURL(image));

    setDescriptionImagePreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [descriptionImages]);

  /* =========================================================
      FORM CHANGE
  ========================================================= */

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

  /* =========================================================
      CAMERA CHANGE
  ========================================================= */

  const handleCameraChange = (field: keyof CameraData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      camera: {
        ...prev.camera,
        [field]: value,
      },
    }));
  };

  /* =========================================================
      COLOR LOGIC
  ========================================================= */

  const addColor = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          name: "",
          isAvailable: true,
          price: null,
        },
      ],
    }));
  };

  const removeColor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, colorIndex) => colorIndex !== index),
    }));
  };

  const handleColorChange = (
    index: number,
    field: keyof ProductColor,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.map((color, colorIndex) => {
        if (colorIndex !== index) {
          return color;
        }

        return {
          ...color,
          [field]: value,
        };
      }),
    }));
  };

  const handleColorPriceChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.map((color, colorIndex) => {
        if (colorIndex !== index) {
          return color;
        }

        return {
          ...color,
          price: value === "" ? null : value,
        };
      }),
    }));
  };

  /* =========================================================
      MAIN IMAGE
  ========================================================= */

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid main image.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("Main image must be less than 20MB.");
      e.target.value = "";
      return;
    }

    setMainImage(file);
  };

  /* =========================================================
      DESCRIPTION IMAGE UPLOAD
  ========================================================= */

  const existingImageCount = existingDescriptionImages.length;

  const totalDescriptionImageCount =
    existingImageCount + descriptionImages.length;

  const remainingDescriptionSlots =
    MAX_DESCRIPTION_IMAGES - totalDescriptionImageCount;

  const handleDescriptionImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    /*
      IMPORTANT:
      New files are appended.

      So the user can:
      - select all 6 at once
      - select 1
      - select another 1
      - select another 2
      - etc.
    */

    if (remainingDescriptionSlots <= 0) {
      alert("Maximum 6 description images allowed.");
      e.target.value = "";
      return;
    }

    if (files.length > remainingDescriptionSlots) {
      alert(
        `You can add only ${remainingDescriptionSlots} more description image${
          remainingDescriptionSlots === 1 ? "" : "s"
        }. Maximum 6 images allowed.`,
      );

      e.target.value = "";
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not a valid image.`);
        e.target.value = "";
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} must be less than 20MB.`);
        e.target.value = "";
        return;
      }
    }

    /*
      APPEND instead of replace.
    */
    setDescriptionImages((prev) => [...prev, ...files]);

    /*
      Reset input so the user can select the same
      file again later if needed.
    */
    e.target.value = "";
  };

  /* =========================================================
      REMOVE NEW DESCRIPTION IMAGE
  ========================================================= */

  const removeDescriptionImage = (index: number) => {
    setDescriptionImages((prev) =>
      prev.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  /* =========================================================
      SUBMIT
  ========================================================= */

  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialData && !mainImage) {
      alert("Please upload a main image.");
      return;
    }

    const price = Number(formData.price);

    if (!Number.isFinite(price) || price < 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (
      formData.discountPrice !== "" &&
      Number(formData.discountPrice) > price
    ) {
      alert("Discount price cannot be greater than price.");
      return;
    }

    /* =======================================================
        VALIDATE COLORS
    ======================================================= */

    for (const color of formData.colors) {
      if (!color.name.trim()) {
        alert("Please enter a name for every color.");
        return;
      }

      if (
        color.price !== null &&
        color.price !== "" &&
        (!Number.isFinite(Number(color.price)) || Number(color.price) < 0)
      ) {
        alert(`Please enter a valid price for color "${color.name}".`);
        return;
      }
    }

    const normalizedColors: ProductColor[] = formData.colors.map((color) => ({
      name: color.name.trim(),
      isAvailable: Boolean(color.isAvailable),
      price:
        color.price === "" || color.price === null || color.price === undefined
          ? null
          : Number(color.price),
    }));

    /* =======================================================
        NORMALIZE CAMERA
    ======================================================= */

    const normalizedCamera: CameraData = {
      front: formData.camera.front.trim(),
      rear: formData.camera.rear.trim(),
    };

    const normalizedWarranty = formData.warranty.trim();
    onSubmit(
      {
        ...formData,

        variantGroupId: formData.variantGroupId.trim(),

        variantName: formData.variantName.trim(),

        camera: normalizedCamera,

        warranty: normalizedWarranty,

        price,

        discountPrice:
          formData.discountPrice === "" ? "" : Number(formData.discountPrice),

        colors: normalizedColors,
      },

      mainImage,

      descriptionImages,
    );
  };

  /* =========================================================
      PREVIEW COUNT
  ========================================================= */

  const totalPreviewCount =
    existingDescriptionImages.length + descriptionImages.length;

  const canUploadDescriptionImages = totalPreviewCount < MAX_DESCRIPTION_IMAGES;

  return (
    <form onSubmit={submitHandler} className="space-y-8">
      {/* =========================================================
          BASIC INFORMATION
      ========================================================= */}

      <div className="border rounded-xl p-5 space-y-5 bg-white">
        <div>
          <h2 className="text-xl font-semibold">Basic Information</h2>

          <p className="text-sm text-gray-500 mt-1">
            Enter the basic details of the mobile product.
          </p>
        </div>

        {/* Product Name */}

        <div>
          <label className="block font-semibold mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
            placeholder="e.g. iPhone 17 Pro Max"
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Brand / Variant Name */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">
              Brand <span className="text-red-500">*</span>
            </label>

            <select
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Brand</option>

              {MOBILE_BRANDS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Variant Name
              <span className="text-gray-500 font-normal"> (Optional)</span>
            </label>

            <input
              type="text"
              name="variantName"
              value={formData.variantName}
              onChange={handleChange}
              placeholder="e.g. Pro Max 8GB 256GB"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Variant Group ID */}

        <div>
          <label className="block font-semibold mb-2">
            Variant Group ID
            <span className="text-gray-500 font-normal"> (Optional)</span>
          </label>

          <input
            type="text"
            name="variantGroupId"
            value={formData.variantGroupId}
            onChange={handleChange}
            placeholder="e.g. iphone-17-pro-max"
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <p className="text-xs text-gray-500 mt-1">
            Use the same Variant Group ID for different variants of the same
            mobile model.
          </p>
        </div>

        {/* RAM / Storage */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">
              RAM <span className="text-red-500">*</span>
            </label>

            <select
              name="ram"
              value={formData.ram}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select RAM</option>

              {RAM_OPTIONS.map((ram) => (
                <option key={ram} value={ram}>
                  {ram}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Storage <span className="text-red-500">*</span>
            </label>

            <select
              name="storage"
              value={formData.storage}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Storage</option>

              {STORAGE_OPTIONS.map((storage) => (
                <option key={storage} value={storage}>
                  {storage}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}

        <div>
          <label className="block font-semibold mb-2">
            Description
            <span className="text-gray-500 font-normal"> (Optional)</span>
          </label>

          <textarea
            name="description"
            rows={6}
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter detailed product description..."
            className="w-full border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* =========================================================
          TECHNICAL SPECIFICATIONS
      ========================================================= */}

      <div className="border rounded-xl p-5 space-y-5 bg-white">
        <div>
          <h2 className="text-xl font-semibold">Technical Specifications</h2>

          <p className="text-sm text-gray-500 mt-1">
            Add the technical specifications of this mobile.
          </p>
        </div>

        {/* Processor / Display */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">
              Processor
              <span className="text-gray-500 font-normal"> (Optional)</span>
            </label>

            <input
              type="text"
              name="processor"
              value={formData.processor}
              onChange={handleChange}
              placeholder="e.g. Snapdragon 8 Gen 4"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Display
              <span className="text-gray-500 font-normal"> (Optional)</span>
            </label>

            <input
              type="text"
              name="display"
              value={formData.display}
              onChange={handleChange}
              placeholder="e.g. 6.7 inch AMOLED 120Hz"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* =====================================================
            CAMERA
        ===================================================== */}

        <div>
          <label className="block font-semibold mb-2">
            Camera
            <span className="text-gray-500 font-normal"> (Optional)</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front Camera */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Front Camera
              </label>

              <input
                type="text"
                name="front"
                value={formData.camera.front}
                onChange={(e) => handleCameraChange("front", e.target.value)}
                placeholder="e.g. 12 MP"
                className="w-full border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Rear Camera */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Rear Camera
              </label>

              <input
                type="text"
                name="rear"
                value={formData.camera.rear}
                onChange={(e) => handleCameraChange("rear", e.target.value)}
                placeholder="e.g. 48 MP + 12 MP + 8 MP"
                className="w-full border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Battery / OS */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">
              Battery
              <span className="text-gray-500 font-normal"> (Optional)</span>
            </label>

            <input
              type="text"
              name="battery"
              value={formData.battery}
              onChange={handleChange}
              placeholder="e.g. 5000 mAh"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Operating System
              <span className="text-gray-500 font-normal"> (Optional)</span>
            </label>

            <input
              type="text"
              name="operatingSystem"
              value={formData.operatingSystem}
              onChange={handleChange}
              placeholder="e.g. Android 16"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Warranty
              <span className="text-gray-500 font-normal"> (Optional)</span>
            </label>

            <input
              type="text"
              name="warranty"
              value={formData.warranty}
              onChange={handleChange}
              placeholder="e.g. 1 year"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Charging */}

        <div>
          <label className="block font-semibold mb-2">
            Charging
            <span className="text-gray-500 font-normal"> (Optional)</span>
          </label>

          <input
            type="text"
            name="charging"
            value={formData.charging}
            onChange={handleChange}
            placeholder="e.g. 67W Fast Charging"
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* =========================================================
          COLORS
      ========================================================= */}

      <div className="border rounded-xl p-5 space-y-5 bg-white">
        <div>
          <h2 className="text-xl font-semibold">Colors</h2>

          <p className="text-sm text-gray-500 mt-1">
            Add the available colors for this mobile. A color can optionally
            have its own price.
          </p>
        </div>

        {formData.colors.length === 0 ? (
          <div className="rounded-lg bg-gray-50 border p-4">
            <p className="text-sm text-gray-600">No colors added yet.</p>

            <p className="text-xs text-gray-500 mt-1">
              If a color has no separate price, the main product price will be
              used.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.colors.map((color, index) => (
              <div key={index} className="border rounded-xl p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  {/* Color Name */}

                  <div>
                    <label className="block font-semibold mb-2">
                      Color Name <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={color.name}
                      onChange={(e) =>
                        handleColorChange(index, "name", e.target.value)
                      }
                      placeholder="e.g. Midnight Black"
                      className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Color Price */}

                  <div>
                    <label className="block font-semibold mb-2">
                      Color Price
                      <span className="text-gray-500 font-normal">
                        {" "}
                        (Optional)
                      </span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={color.price ?? ""}
                      onChange={(e) =>
                        handleColorPriceChange(index, e.target.value)
                      }
                      placeholder="Uses main price"
                      className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Availability + Remove */}

                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={color.isAvailable}
                        onChange={(e) =>
                          handleColorChange(
                            index,
                            "isAvailable",
                            e.target.checked,
                          )
                        }
                        className="w-5 h-5"
                      />

                      <span className="font-medium">Available</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  {color.price === null || color.price === ""
                    ? "This color will use the main product price."
                    : `This color will use ₹${Number(
                        color.price,
                      ).toLocaleString("en-IN")} as its price.`}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addColor}
          className="px-5 py-2.5 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 font-semibold"
        >
          + Add Color
        </button>
      </div>

      {/* =========================================================
          PRICING
      ========================================================= */}

      <div className="border rounded-xl p-5 space-y-5 bg-white">
        <div>
          <h2 className="text-xl font-semibold">Pricing</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">
              Price <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="Enter price"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Discount Price
              <span className="text-gray-500 font-normal"> (Optional)</span>
            </label>

            <input
              type="number"
              name="discountPrice"
              min="0"
              step="0.01"
              value={formData.discountPrice}
              onChange={handleChange}
              placeholder="Enter discount price"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 border p-4 text-sm text-gray-600">
          <strong>Main price:</strong> Used as the default price for all colors
          that do not have their own color-specific price.
        </div>
      </div>

      {/* =========================================================
          PRODUCT IMAGES
      ========================================================= */}

      <div className="border rounded-xl p-5 space-y-5 bg-white">
        <div>
          <h2 className="text-xl font-semibold">Product Images</h2>

          <p className="text-sm text-gray-500 mt-1">
            Upload the main product image and up to 6 description images.
          </p>
        </div>

        {/* =====================================================
            MAIN IMAGE
        ===================================================== */}

        <div>
          <label className="block font-semibold mb-2">
            Main Image <span className="text-red-500">*</span>
          </label>

          <input
            type="file"
            accept="image/*"
            required={!initialData}
            onChange={handleMainImageChange}
            className="w-full border rounded-lg p-3"
          />

          {mainImagePreview && (
            <div className="mt-4">
              <div className="relative w-44 h-44">
                <img
                  src={mainImagePreview}
                  alt="Main product preview"
                  className="w-44 h-44 rounded-lg object-cover border"
                />
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            DESCRIPTION IMAGES
        ===================================================== */}

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <label className="block font-semibold">
              Description Images{" "}
              <span className="text-gray-500 text-sm font-normal">
                (Maximum 6)
              </span>
            </label>

            <span
              className={`text-sm font-medium ${
                totalPreviewCount >= MAX_DESCRIPTION_IMAGES
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {totalPreviewCount}/{MAX_DESCRIPTION_IMAGES} images
            </span>
          </div>

          {/* Upload input */}

          {canUploadDescriptionImages ? (
            <>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleDescriptionImagesChange}
                className="w-full border rounded-lg p-3"
              />

              <p className="text-xs text-gray-500 mt-2">
                You can select images all at once or add them one by one. You
                can add <strong>{remainingDescriptionSlots}</strong> more.
              </p>
            </>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                Maximum 6 description images reached.
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Delete an image to add another one.
              </p>
            </div>
          )}

          {/* ===================================================
              EXISTING IMAGES
          =================================================== */}

          {existingDescriptionImages.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium mb-3">
                Existing Description Images
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {existingDescriptionImages.map((image) => (
                  <div key={image.key} className="relative group">
                    <img
                      src={image.url}
                      alt="Existing description"
                      className="w-full h-28 rounded-lg object-cover border"
                    />

                    {/* Red close button */}

                    <button
                      type="button"
                      onClick={() =>
                        onRemoveExistingDescriptionImage?.(image.key)
                      }
                      className="
                        absolute
                        -top-2
                        -right-2
                        bg-red-600
                        hover:bg-red-700
                        text-white
                        rounded-full
                        w-7
                        h-7
                        flex
                        items-center
                        justify-center
                        text-lg
                        font-bold
                        shadow
                      "
                      aria-label="Delete existing image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================
              NEW IMAGE PREVIEWS
          =================================================== */}

          {descriptionImages.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium mb-3">New Description Images</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {descriptionImages.map((image, index) => (
                  <div
                    key={`${image.name}-${image.lastModified}-${index}`}
                    className="relative group"
                  >
                    <img
                      src={descriptionImagePreviews[index]}
                      alt={`Description ${index + 1}`}
                      className="w-full h-28 rounded-lg object-cover border"
                    />

                    {/* Red close button */}

                    <button
                      type="button"
                      onClick={() => removeDescriptionImage(index)}
                      className="
                        absolute
                        -top-2
                        -right-2
                        bg-red-600
                        hover:bg-red-700
                        text-white
                        rounded-full
                        w-7
                        h-7
                        flex
                        items-center
                        justify-center
                        text-lg
                        font-bold
                        shadow
                      "
                      aria-label={`Delete description image ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No images */}

          {existingDescriptionImages.length === 0 &&
            descriptionImages.length === 0 && (
              <div className="mt-4 rounded-lg bg-gray-50 border p-4">
                <p className="text-sm text-gray-600">
                  No description images selected.
                </p>
              </div>
            )}
        </div>
      </div>

      {/* =========================================================
          AVAILABILITY
      ========================================================= */}

      <div className="border rounded-xl p-5 bg-white">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleChange}
            className="w-5 h-5"
          />

          <span className="font-semibold">Product Available</span>
        </label>
      </div>

      {/* =========================================================
          SUBMIT
      ========================================================= */}

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
}
