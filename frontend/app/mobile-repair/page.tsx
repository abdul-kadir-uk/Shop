"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ImagePlus,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type RepairProblem = {
  id: string;
  name: string;
  price: number;
};

type UploadedImage = {
  file: File;
  preview: string;
};

const BRANDS: Record<string, string[]> = {
  Apple: [
    "iPhone 17 Pro Max",
    "iPhone 17 Pro",
    "iPhone 17",
    "iPhone 16 Pro Max",
    "iPhone 16 Pro",
    "iPhone 16",
    "iPhone 15 Pro Max",
    "iPhone 15",
    "iPhone 14",
    "iPhone 13",
    "iPhone 12",
    "iPhone 11",
  ],
  Samsung: [
    "Galaxy S25 Ultra",
    "Galaxy S24 Ultra",
    "Galaxy S24",
    "Galaxy S23",
    "Galaxy A56",
    "Galaxy A55",
    "Galaxy A35",
    "Galaxy A15",
    "Galaxy M35",
    "Galaxy M15",
  ],
  Redmi: [
    "Redmi Note 14 Pro+",
    "Redmi Note 14 Pro",
    "Redmi Note 14",
    "Redmi Note 13 Pro+",
    "Redmi Note 13 Pro",
    "Redmi Note 13",
    "Redmi 14C",
    "Redmi 13C",
  ],
  Xiaomi: [
    "Xiaomi 15 Ultra",
    "Xiaomi 15",
    "Xiaomi 14",
    "Xiaomi 14 Civi",
    "Xiaomi 13 Pro",
  ],
  Vivo: [
    "Vivo V50",
    "Vivo V40",
    "Vivo V30",
    "Vivo T4",
    "Vivo T3",
    "Vivo Y200",
    "Vivo Y100",
    "Vivo Y28",
  ],
  Oppo: [
    "Oppo Reno13 Pro",
    "Oppo Reno13",
    "Oppo Reno12 Pro",
    "Oppo Reno12",
    "Oppo F27 Pro+",
    "Oppo A5 Pro",
    "Oppo A3",
  ],
  OnePlus: [
    "OnePlus 13",
    "OnePlus 13R",
    "OnePlus 12",
    "OnePlus 12R",
    "OnePlus Nord 4",
    "OnePlus Nord CE4",
    "OnePlus Nord CE3",
  ],
  Realme: [
    "Realme GT 7 Pro",
    "Realme GT 6",
    "Realme 14 Pro+",
    "Realme 13 Pro",
    "Realme Narzo 70",
    "Realme C75",
    "Realme C65",
  ],
  Motorola: [
    "Motorola Edge 50 Pro",
    "Motorola Edge 50 Fusion",
    "Moto G85",
    "Moto G75",
    "Moto G64",
    "Moto G54",
  ],
  Google: [
    "Pixel 9 Pro XL",
    "Pixel 9 Pro",
    "Pixel 9",
    "Pixel 8 Pro",
    "Pixel 8",
    "Pixel 7",
  ],
  Nothing: [
    "Nothing Phone (3)",
    "Nothing Phone (2a) Plus",
    "Nothing Phone (2a)",
    "Nothing Phone (2)",
    "Nothing Phone (1)",
  ],
  iQOO: ["iQOO 13", "iQOO Neo 10", "iQOO Neo 9 Pro", "iQOO Z10", "iQOO Z9"],
  Poco: ["Poco X7 Pro", "Poco X7", "Poco X6 Pro", "Poco M7 Pro", "Poco M6 Pro"],
  Other: [],
};

const PROBLEMS: RepairProblem[] = [
  { id: "screen", name: "Screen Damage", price: 1499 },
  { id: "battery", name: "Battery Problem", price: 699 },
  { id: "charging", name: "Charging Issue", price: 499 },
  { id: "power", name: "Phone Not Turning On", price: 799 },
  { id: "speaker", name: "Speaker / Mic Issue", price: 399 },
  { id: "camera", name: "Camera Problem", price: 599 },
  { id: "water", name: "Water Damage", price: 999 },
  { id: "software", name: "Software / Hanging", price: 299 },
  { id: "network", name: "Network / SIM Issue", price: 399 },
  { id: "buttons", name: "Button Problem", price: 399 },
  { id: "fingerprint", name: "Fingerprint / Face Unlock", price: 499 },
  { id: "other", name: "Other Problem", price: 299 },
];

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function MobileRepairPage() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = BRANDS[brand] ?? [];
  const finalModel = brand === "Other" ? customModel.trim() : model;

  const selectedProblemDetails = PROBLEMS.filter((problem) =>
    selectedProblems.includes(problem.id),
  );

  const estimatedPrice = selectedProblemDetails.reduce(
    (total, problem) => total + problem.price,
    0,
  );

  const totalEstimate =
    estimatedPrice === 0 ? 0 : Math.max(199, estimatedPrice);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  function handleBrandChange(value: string) {
    setBrand(value);
    setModel("");
    setCustomModel("");
    setShowSummary(false);

    setErrors((previous) => ({
      ...previous,
      brand: "",
      model: "",
    }));
  }

  function toggleProblem(id: string) {
    setSelectedProblems((previous) =>
      previous.includes(id)
        ? previous.filter((problem) => problem !== id)
        : [...previous, id],
    );

    setShowSummary(false);
    setErrors((previous) => ({ ...previous, problems: "" }));
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setUploadError("");

    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      setUploadError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    const accepted: UploadedImage[] = [];
    const errorsFound: string[] = [];

    for (const file of files) {
      if (accepted.length >= remainingSlots) {
        errorsFound.push(`Only ${MAX_IMAGES} images can be uploaded.`);
        break;
      }

      if (!file.type.startsWith("image/")) {
        errorsFound.push(`${file.name} is not a valid image.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errorsFound.push(`${file.name} exceeds the 5 MB limit.`);
        continue;
      }

      accepted.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      setImages((previous) => [...previous, ...accepted]);
      setShowSummary(false);
    }

    if (errorsFound.length > 0) {
      setUploadError(errorsFound.join(" "));
    }

    event.target.value = "";
  }

  function removeImage(index: number) {
    setImages((previous) => {
      const imageToRemove = previous[index];

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return previous.filter((_, imageIndex) => imageIndex !== index);
    });

    setShowSummary(false);
  }

  function handleReviewBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!brand) {
      nextErrors.brand = "Please select your mobile brand.";
    }

    if (!finalModel) {
      nextErrors.model = "Please select or enter your mobile model.";
    }

    if (selectedProblems.length === 0) {
      nextErrors.problems = "Please select at least one problem.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setShowSummary(false);
      return;
    }

    setIsSubmitting(true);
    setShowSummary(true);

    window.setTimeout(() => {
      setIsSubmitting(false);

      document
        .getElementById("repair-summary")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  const sectionClass =
    "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-800";

  const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50 text-slate-900">
        {/* Compact hero */}
        <section className="bg-linear-to-r from-slate-950 to-blue-950">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white sm:h-14 sm:w-14">
              <Smartphone className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>

            <div>
              <h1 className="text-xl font-bold leading-tight text-white sm:text-3xl">
                Mobile Repair
              </h1>
              <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
                Select your phone, choose the problems, and get an estimate.
              </p>
            </div>
          </div>
        </section>

        {/* Booking form */}
        <section
          id="repair-form"
          className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Book a repair
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Enter your phone details below. Fields marked * are required.
            </p>
          </div>

          <form onSubmit={handleReviewBooking} noValidate>
            <div className="grid items-start gap-4 lg:grid-cols-[1fr_290px]">
              <div className="space-y-4">
                {/* Brand and model */}
                <section className={sectionClass}>
                  <h3 className="mb-3 text-sm font-bold sm:text-base">
                    1. Select your phone
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="brand" className={labelClass}>
                        Mobile brand <span className="text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <select
                          id="brand"
                          value={brand}
                          onChange={(event) =>
                            handleBrandChange(event.target.value)
                          }
                          className={`${selectClass} appearance-none pr-9 ${
                            errors.brand ? "border-red-400" : ""
                          }`}
                        >
                          <option value="">Select brand</option>
                          {Object.keys(BRANDS).map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>

                      {errors.brand && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.brand}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="model" className={labelClass}>
                        Mobile model <span className="text-red-500">*</span>
                      </label>

                      {brand === "Other" ? (
                        <input
                          id="model"
                          type="text"
                          value={customModel}
                          onChange={(event) => {
                            setCustomModel(event.target.value);
                            setShowSummary(false);
                            setErrors((previous) => ({
                              ...previous,
                              model: "",
                            }));
                          }}
                          placeholder="Enter model name"
                          className={`${selectClass} ${
                            errors.model ? "border-red-400" : ""
                          }`}
                        />
                      ) : (
                        <div className="relative">
                          <select
                            id="model"
                            value={model}
                            onChange={(event) => {
                              setModel(event.target.value);
                              setShowSummary(false);
                              setErrors((previous) => ({
                                ...previous,
                                model: "",
                              }));
                            }}
                            disabled={!brand || models.length === 0}
                            className={`${selectClass} appearance-none pr-9 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                              errors.model ? "border-red-400" : ""
                            }`}
                          >
                            <option value="">
                              {!brand ? "Select brand first" : "Select model"}
                            </option>
                            {models.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      )}

                      {errors.model && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.model}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Problems */}
                <section className={sectionClass}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold sm:text-base">
                      2. Select problems
                    </h3>
                    <span className="text-xs text-slate-500">
                      {selectedProblems.length} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PROBLEMS.map((problem) => {
                      const isSelected = selectedProblems.includes(problem.id);

                      return (
                        <label
                          key={problem.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-3 transition sm:px-3 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProblem(problem.id)}
                            className="h-4 w-4 shrink-0 accent-blue-600"
                          />

                          <span className="text-xs font-medium leading-4 sm:text-sm">
                            {problem.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {errors.problems && (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.problems}
                    </p>
                  )}
                </section>

                {/* Compact image upload */}
                <section className={sectionClass}>
                  <h3 className="mb-3 text-sm font-bold sm:text-base">
                    3. Phone photos{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  </h3>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= MAX_IMAGES}
                    className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-left transition hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <ImagePlus className="h-5 w-5 shrink-0 text-blue-600" />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">
                        Add phone photos
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {images.length}/{MAX_IMAGES} images · Max 5 MB each
                      </span>
                    </span>

                    <Upload className="h-4 w-4 shrink-0 text-slate-500" />
                  </button>

                  {uploadError && (
                    <p className="mt-2 text-xs text-red-600">{uploadError}</p>
                  )}

                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {images.map((image, index) => (
                        <div
                          key={`${image.file.name}-${index}`}
                          className="relative overflow-hidden rounded-lg border border-slate-200"
                        >
                          <img
                            src={image.preview}
                            alt={`Phone photo ${index + 1}`}
                            className="h-20 w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            aria-label={`Remove photo ${index + 1}`}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-600 shadow"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Description */}
                <section className={sectionClass}>
                  <h3 className="mb-3 text-sm font-bold sm:text-base">
                    4. Additional description{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  </h3>

                  <textarea
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      setShowSummary(false);
                    }}
                    maxLength={1000}
                    rows={3}
                    placeholder="Describe any additional issues..."
                    className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-5 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {description.length}/1000
                  </p>
                </section>
              </div>

              {/* Estimate summary */}
              <aside className="lg:sticky lg:top-5">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-slate-950 p-4 text-white">
                    <p className="text-xs font-medium text-slate-300">
                      Estimated repair cost
                    </p>
                    <p className="mt-1 text-3xl font-extrabold">
                      {formatPrice(totalEstimate)}
                      {totalEstimate > 0 && "+"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Indicative starting price only.
                    </p>
                  </div>

                  <div className="space-y-4 p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Selected phone
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {brand || "Brand not selected"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {finalModel || "Model not selected"}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Selected problems
                      </p>

                      {selectedProblemDetails.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {selectedProblemDetails.map((problem) => (
                            <li
                              key={problem.id}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-slate-600">
                                {problem.name}
                              </span>
                              <span className="shrink-0 font-semibold text-slate-800">
                                {formatPrice(problem.price)}+
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">
                          No problems selected yet.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          Review estimate
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                      No payment required now
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </form>

          {/* Review summary */}
          {showSummary && (
            <section
              id="repair-summary"
              className="mt-5 scroll-mt-5 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold">
                    Your repair estimate is ready
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    Review your selections. Your repair booking has not been
                    submitted yet.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold">
                  {brand} {finalModel}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedProblemDetails.map((problem) => (
                    <span
                      key={problem.id}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                    >
                      {problem.name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm">
                  Estimated cost: <strong>{formatPrice(totalEstimate)}+</strong>
                </p>
              </div>

              {description.trim() && (
                <div className="mt-3">
                  <p className="text-xs font-semibold">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {description}
                  </p>
                </div>
              )}

              {images.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  {images.length} photo(s) attached to this local preview.
                </p>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
                Final pricing depends on the phone model, required parts, and
                technician inspection.
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSummary(false);
                  document
                    .getElementById("repair-form")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Edit details
              </button>
            </section>
          )}

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            Prices are sample estimates and must be confirmed before offering
            the repair service to customers.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
