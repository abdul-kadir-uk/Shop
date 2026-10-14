"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Package,
} from "lucide-react";

export const MEDICINE_UNITS = [
  "tablet",
  "capsule",
  "strip",
  "bottle",
  "ml",
  "mg",
  "g",
  "piece",
  "packet",
  "box",
  "tube",
  "sachet",
  "unit",
] as const;

export type MedicineUnit = (typeof MEDICINE_UNITS)[number];

export type MedicineVariant = {
  quantity: number;
  unit: MedicineUnit;
  price: number | "";
  discountPrice: number | "" | null;
  stock: number | "";
  isDefault: boolean;
};

export type MedicineProductFormData = {
  productName: string;
  description: string;
  brand: string;
  manufacturer: string;
  productCategory: string;
  productSubCategory: string;
  composition: string;
  strength: string;
  dosageForm: string;
  packSize: string;
  requiresPrescription: boolean;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  price: number | "";
  discountPrice: number | "";
  quantity: number | "";
  unit: MedicineUnit;
  stock: number | "";
  trackInventory: boolean;
  status: "draft" | "active" | "inactive";
  isAvailable: boolean;
  variants: MedicineVariant[];
};

type ExistingImage = {
  key: string;
  url: string;
};

type Props = {
  onSubmit: (
    data: MedicineProductFormData,
    mainImage: File | null,
    descriptionImages: File[],
    keepDescriptionImages?: ExistingImage[],
  ) => Promise<void>;
  submitting?: boolean;
  initialData?: Partial<MedicineProductFormData> & {
    _id?: string;
    mainImage?: ExistingImage;
    descriptionImages?: ExistingImage[];
  };
  existingMainImage?: string;
  existingDescriptionImages?: ExistingImage[];
};

const initialForm: MedicineProductFormData = {
  productName: "",
  description: "",
  brand: "",
  manufacturer: "",
  productCategory: "",
  productSubCategory: "",
  composition: "",
  strength: "",
  dosageForm: "",
  packSize: "",
  requiresPrescription: false,
  batchNumber: "",
  manufacturingDate: "",
  expiryDate: "",
  price: "",
  discountPrice: "",
  quantity: "",
  unit: "tablet",
  stock: 0,
  trackInventory: true,
  status: "active",
  isAvailable: true,
  variants: [],
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

function toDateInputValue(value: unknown): string {
  if (!value) return "";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function normalizeInitialData(
  data?: Partial<MedicineProductFormData>,
): MedicineProductFormData {
  return {
    ...initialForm,
    ...data,
    manufacturingDate: toDateInputValue(data?.manufacturingDate),
    expiryDate: toDateInputValue(data?.expiryDate),
    variants: (data?.variants ?? []).map((variant) => ({
      ...variant,
      quantity: Number(variant.quantity),
      price: variant.price === "" ? "" : Number(variant.price),
      discountPrice:
        variant.discountPrice === "" || variant.discountPrice == null
          ? null
          : Number(variant.discountPrice),
      stock: variant.stock === "" ? 0 : Number(variant.stock),
      unit: variant.unit ?? "tablet",
      isDefault: Boolean(variant.isDefault),
    })),
  };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function MedicineProductForm({
  onSubmit,
  submitting = false,
  initialData,
  existingMainImage = "",
  existingDescriptionImages = [],
}: Props) {
  const [form, setForm] = useState<MedicineProductFormData>(() =>
    normalizeInitialData(initialData),
  );

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [descriptionImages, setDescriptionImages] = useState<File[]>([]);
  const [mainPreview, setMainPreview] = useState("");
  const [descriptionPreviews, setDescriptionPreviews] = useState<string[]>([]);

  const [keptDescriptionImages, setKeptDescriptionImages] = useState<
    ExistingImage[]
  >(existingDescriptionImages);

  const [useVariants, setUseVariants] = useState(
    Boolean(initialData?.variants?.length),
  );

  const [error, setError] = useState("");

  const isEditing = Boolean(initialData?._id);
  const displayedMainImage = mainPreview || existingMainImage;

  useEffect(() => {
    if (!mainImage) {
      setMainPreview("");
      return;
    }

    const url = URL.createObjectURL(mainImage);
    setMainPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [mainImage]);

  useEffect(() => {
    const urls = descriptionImages.map((file) => URL.createObjectURL(file));

    setDescriptionPreviews(urls);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [descriptionImages]);

  const update = <K extends keyof MedicineProductFormData>(
    key: K,
    value: MedicineProductFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const addVariant = () => {
    setForm((previous) => ({
      ...previous,
      variants: [
        ...previous.variants,
        {
          quantity: 1,
          unit: previous.unit,
          price: "",
          discountPrice: null,
          stock: 0,
          isDefault: previous.variants.length === 0,
        },
      ],
    }));
  };

  const updateVariant = (
    index: number,
    key: keyof MedicineVariant,
    value: string | number | boolean | null,
  ) => {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, variantIndex) => {
        if (variantIndex !== index) {
          return key === "isDefault" && value === true
            ? { ...variant, isDefault: false }
            : variant;
        }

        return { ...variant, [key]: value };
      }),
    }));
  };

  const removeVariant = (index: number) => {
    setForm((previous) => {
      const variants = previous.variants.filter(
        (_, variantIndex) => variantIndex !== index,
      );

      if (variants.length && !variants.some((variant) => variant.isDefault)) {
        variants[0] = { ...variants[0], isDefault: true };
      }

      return { ...previous, variants };
    });
  };

  const handleMainImage = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid main image.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Main image must be 20 MB or smaller.");
      return;
    }

    setError("");
    setMainImage(file);
  };

  const handleDescriptionImages = (files: FileList | null) => {
    if (!files) return;

    const selected = Array.from(files);

    if (
      keptDescriptionImages.length +
        descriptionImages.length +
        selected.length >
      4
    ) {
      setError("You can upload a maximum of 4 description images.");
      return;
    }

    if (
      selected.some(
        (file) =>
          !file.type.startsWith("image/") || file.size > 20 * 1024 * 1024,
      )
    ) {
      setError("Every description image must be an image of 20 MB or smaller.");
      return;
    }

    setError("");
    setDescriptionImages((previous) => [...previous, ...selected]);
  };

  const removeDescriptionImage = (index: number) => {
    setDescriptionImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  const removeExistingDescriptionImage = (image: ExistingImage) => {
    setKeptDescriptionImages((previous) =>
      previous.filter((item) => item !== image),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!mainImage && !existingMainImage) {
      setError("Please select a main product image.");
      return;
    }

    if (
      !form.productName.trim() ||
      !form.productCategory.trim() ||
      !form.productSubCategory.trim()
    ) {
      setError("Please fill in the product name, category and subcategory.");
      return;
    }

    if (!useVariants) {
      if (form.price === "" || form.quantity === "") {
        setError("Please enter the price and quantity.");
        return;
      }

      if (Number(form.price) < 0 || Number(form.quantity) < 0) {
        setError("Price and quantity cannot be negative.");
        return;
      }

      if (
        form.discountPrice !== "" &&
        Number(form.discountPrice) > Number(form.price)
      ) {
        setError("Discount price cannot be greater than the original price.");
        return;
      }
    } else {
      if (form.variants.length === 0) {
        setError("Add at least one pack variant or disable variants.");
        return;
      }

      if (!form.variants.some((variant) => variant.isDefault)) {
        setError("Please select a default pack variant.");
        return;
      }

      for (const variant of form.variants) {
        if (
          variant.price === "" ||
          !Number.isFinite(Number(variant.price)) ||
          Number(variant.price) < 0 ||
          !Number.isFinite(Number(variant.quantity)) ||
          Number(variant.quantity) <= 0 ||
          Number(variant.stock) < 0
        ) {
          setError("Check the quantity, price and stock of each variant.");
          return;
        }

        if (
          variant.discountPrice !== "" &&
          variant.discountPrice !== null &&
          (Number(variant.discountPrice) < 0 ||
            Number(variant.discountPrice) > Number(variant.price))
        ) {
          setError("A variant discount cannot exceed its original price.");
          return;
        }
      }
    }

    if (
      form.manufacturingDate &&
      form.expiryDate &&
      new Date(form.expiryDate) < new Date(form.manufacturingDate)
    ) {
      setError("Expiry date cannot be earlier than manufacturing date.");
      return;
    }

    const normalizedVariants: MedicineVariant[] = useVariants
      ? form.variants.map((variant) => ({
          ...variant,
          price: Number(variant.price),
          discountPrice:
            variant.discountPrice === "" || variant.discountPrice === null
              ? null
              : Number(variant.discountPrice),
          quantity: Number(variant.quantity),
          stock: Number(variant.stock || 0),
        }))
      : [];

    try {
      await onSubmit(
        { ...form, variants: normalizedVariants },
        mainImage,
        descriptionImages,
        keptDescriptionImages,
      );
    } catch (submitError) {
      console.error(submitError);
      setError("Unable to save the medicine product. Please try again.");
    }
  };

  const totalDescriptionImages =
    keptDescriptionImages.length + descriptionImages.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Section
        title="Basic Product Information"
        description="Enter the medicine's name and classification."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Medicine Name" required>
            <input
              className={inputClass}
              value={form.productName}
              maxLength={150}
              onChange={(e) => update("productName", e.target.value)}
              placeholder="e.g. Paracetamol"
              required
            />
          </Field>

          <Field label="Brand">
            <input
              className={inputClass}
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              placeholder="Brand name"
            />
          </Field>

          <Field label="Manufacturer">
            <input
              className={inputClass}
              value={form.manufacturer}
              onChange={(e) => update("manufacturer", e.target.value)}
              placeholder="Manufacturer name"
            />
          </Field>

          <Field label="Category" required>
            <input
              className={inputClass}
              value={form.productCategory}
              onChange={(e) => update("productCategory", e.target.value)}
              placeholder="e.g. Medicines"
              required
            />
          </Field>

          <Field label="Subcategory" required>
            <input
              className={inputClass}
              value={form.productSubCategory}
              onChange={(e) => update("productSubCategory", e.target.value)}
              placeholder="e.g. Pain Relief"
              required
            />
          </Field>

          <Field label="Dosage Form">
            <select
              className={inputClass}
              value={form.dosageForm}
              onChange={(e) => update("dosageForm", e.target.value)}
            >
              <option value="">Select dosage form</option>
              {[
                "Tablet",
                "Capsule",
                "Syrup",
                "Drops",
                "Injection",
                "Cream",
                "Ointment",
                "Gel",
                "Powder",
                "Spray",
                "Inhaler",
                "Suspension",
                "Other",
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Composition">
            <input
              className={inputClass}
              value={form.composition}
              onChange={(e) => update("composition", e.target.value)}
              placeholder="Active ingredients"
            />
          </Field>

          <Field label="Strength">
            <input
              className={inputClass}
              value={form.strength}
              onChange={(e) => update("strength", e.target.value)}
              placeholder="e.g. 500 mg"
            />
          </Field>

          <Field label="Pack Size">
            <input
              className={inputClass}
              value={form.packSize}
              onChange={(e) => update("packSize", e.target.value)}
              placeholder="e.g. 10 tablets, 100 ml"
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Description">
            <textarea
              className={inputClass}
              rows={4}
              maxLength={3000}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Enter medicine details and usage information."
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {form.description.length}/3000
            </p>
          </Field>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-blue-600"
            checked={form.requiresPrescription}
            onChange={(e) => update("requiresPrescription", e.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold text-gray-900">
              Prescription required
            </span>
            <span className="mt-1 block text-xs text-gray-600">
              Mark this product if a valid prescription is required for sale.
            </span>
          </span>
        </label>
      </Section>

      <Section
        title="Pricing and Inventory"
        description="Set the price, pack quantity and available stock."
      >
        <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-blue-600"
            checked={useVariants}
            onChange={(e) => {
              const enabled = e.target.checked;
              setUseVariants(enabled);
              setError("");

              if (enabled && form.variants.length === 0) {
                setForm((previous) => ({
                  ...previous,
                  variants: [
                    {
                      quantity:
                        Number(previous.quantity) > 0
                          ? Number(previous.quantity)
                          : 1,
                      unit: previous.unit,
                      price: previous.price,
                      discountPrice: previous.discountPrice,
                      stock: previous.stock,
                      isDefault: true,
                    },
                  ],
                }));
              }
            }}
          />
          <span>
            <span className="block text-sm font-semibold text-gray-900">
              This medicine has multiple pack variants
            </span>
            <span className="mt-1 block text-xs text-gray-600">
              Enable this for different quantities or pack sizes with separate
              prices and stock.
            </span>
          </span>
        </label>

        {!useVariants && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Price (₹)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.price}
                onChange={(e) =>
                  update(
                    "price",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                required
              />
            </Field>

            <Field label="Discount Price (₹)">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.discountPrice}
                onChange={(e) =>
                  update(
                    "discountPrice",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="Optional"
              />
            </Field>

            <Field label="Quantity" required>
              <input
                type="number"
                min="0"
                step="any"
                className={inputClass}
                value={form.quantity}
                onChange={(e) =>
                  update(
                    "quantity",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                required
              />
            </Field>

            <Field label="Unit" required>
              <select
                className={inputClass}
                value={form.unit}
                onChange={(e) => update("unit", e.target.value as MedicineUnit)}
              >
                {MEDICINE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Stock">
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.stock}
                onChange={(e) =>
                  update(
                    "stock",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </Field>
          </div>
        )}

        {useVariants && (
          <div className="space-y-4">
            {form.variants.map((variant, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">
                    Pack Variant {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    aria-label={`Remove variant ${index + 1}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Quantity" required>
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      className={inputClass}
                      value={variant.quantity}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "quantity",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      required
                    />
                  </Field>

                  <Field label="Unit" required>
                    <select
                      className={inputClass}
                      value={variant.unit}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "unit",
                          e.target.value as MedicineUnit,
                        )
                      }
                    >
                      {MEDICINE_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Price (₹)" required>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "price",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      required
                    />
                  </Field>

                  <Field label="Discount Price (₹)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={variant.discountPrice ?? ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "discountPrice",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="Optional"
                    />
                  </Field>

                  <Field label="Stock">
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "stock",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                    />
                  </Field>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="radio"
                    name="defaultMedicineVariant"
                    checked={variant.isDefault}
                    onChange={() => updateVariant(index, "isDefault", true)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Use as default variant
                </label>
              </div>
            ))}

            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <Plus size={18} />
              Add Pack Variant
            </button>
          </div>
        )}

        <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-blue-600"
              checked={form.trackInventory}
              onChange={(e) => update("trackInventory", e.target.checked)}
            />
            Track inventory for this product
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-blue-600"
              checked={form.isAvailable}
              onChange={(e) => update("isAvailable", e.target.checked)}
            />
            Product is available for purchase
          </label>
        </div>
      </Section>

      <Section
        title="Batch and Expiry Information"
        description="Add batch details to help manage medicine expiry."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Batch Number">
            <input
              className={inputClass}
              value={form.batchNumber}
              onChange={(e) => update("batchNumber", e.target.value)}
              placeholder="Batch number"
            />
          </Field>

          <Field label="Manufacturing Date">
            <input
              type="date"
              className={inputClass}
              value={form.manufacturingDate}
              onChange={(e) => update("manufacturingDate", e.target.value)}
            />
          </Field>

          <Field label="Expiry Date">
            <input
              type="date"
              className={inputClass}
              value={form.expiryDate}
              min={form.manufacturingDate || undefined}
              onChange={(e) => update("expiryDate", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Product Images"
        description={
          isEditing
            ? "Keep the current main image or replace it. You can keep, remove or add up to four description images."
            : "A main image is required. You can also add up to four description images."
        }
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Field label="Main Product Image" required={!existingMainImage}>
              <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50">
                {displayedMainImage ? (
                  <img
                    src={displayedMainImage}
                    alt="Main medicine preview"
                    className="max-h-44 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <ImageIcon size={36} className="mb-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Click to upload main image
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      Image files, up to 20 MB
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleMainImage(e.target.files?.[0])}
                />
              </label>

              {mainImage && (
                <p className="mt-2 break-all text-xs text-gray-500">
                  Replacement: {mainImage.name}
                </p>
              )}

              {existingMainImage && !mainImage && (
                <p className="mt-2 text-xs text-gray-500">
                  Current image will be retained unless you select a
                  replacement.
                </p>
              )}
            </Field>
          </div>

          <div>
            <Field label={`Description Images (${totalDescriptionImages}/4)`}>
              <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <Upload size={32} className="mb-3 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Click to add description images
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  Select up to {Math.max(0, 4 - totalDescriptionImages)} more
                  image(s)
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={totalDescriptionImages >= 4}
                  className="hidden"
                  onChange={(e) => {
                    handleDescriptionImages(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </Field>
          </div>
        </div>

        {keptDescriptionImages.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Existing Description Images
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {keptDescriptionImages.map((image, index) => (
                <div
                  key={image.key || image.url}
                  className="relative rounded-lg border border-gray-200 p-2"
                >
                  <img
                    src={image.url}
                    alt={`Existing description image ${index + 1}`}
                    className="h-28 w-full rounded object-contain"
                  />

                  <button
                    type="button"
                    onClick={() => removeExistingDescriptionImage(image)}
                    className="absolute right-1 top-1 rounded-full bg-white p-1.5 text-red-600 shadow hover:bg-red-50"
                    aria-label={`Remove existing description image ${index + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {descriptionPreviews.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              New Description Images
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {descriptionPreviews.map((preview, index) => (
                <div
                  key={`${descriptionImages[index]?.name}-${index}`}
                  className="relative rounded-lg border border-gray-200 p-2"
                >
                  <img
                    src={preview}
                    alt={`New description image ${index + 1}`}
                    className="h-28 w-full rounded object-contain"
                  />

                  <button
                    type="button"
                    onClick={() => removeDescriptionImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-white p-1.5 text-red-600 shadow hover:bg-red-50"
                    aria-label={`Remove new description image ${index + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>

                  <p className="mt-1 truncate text-xs text-gray-500">
                    {descriptionImages[index]?.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Publishing">
        <Field label="Product Status">
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) =>
              update(
                "status",
                e.target.value as "draft" | "active" | "inactive",
              )
            }
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>

        <p className="mt-2 text-xs text-gray-500">
          Availability and status are separate settings. Your backend stores
          both fields.
        </p>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white/95 p-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:rounded-xl sm:border sm:bg-white">
        <button
          type="button"
          onClick={() => window.history.back()}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Package size={18} />
          {submitting
            ? "Saving Product..."
            : isEditing
              ? "Update Medicine Product"
              : "Add Medicine Product"}
        </button>
      </div>
    </form>
  );
}
