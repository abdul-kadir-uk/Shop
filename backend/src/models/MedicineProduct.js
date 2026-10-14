// src/models/MedicineProduct.js

import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const variantSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const medicineProductSchema = new mongoose.Schema(
  {
    // Seller
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    // Product Details
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    manufacturer: {
      type: String,
      trim: true,
      default: "",
    },

    // Medicine Classification
    productCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    productSubCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Medicine Information
    composition: {
      type: String,
      trim: true,
      default: "",
    },

    strength: {
      type: String,
      trim: true,
      default: "",
    },

    dosageForm: {
      type: String,
      trim: true,
      default: "",
      // Tablet, capsule, syrup, drops, cream, etc.
    },

    packSize: {
      type: String,
      trim: true,
      default: "",
      // Example: 10 tablets, 100 ml, 15 capsules
    },

    unit: {
      type: String,
      required: true,
      enum: [
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
      ],
    },

    // Prescription Requirements
    requiresPrescription: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Images
    mainImage: {
      type: imageSchema,
      required: true,
    },

    descriptionImages: {
      type: [imageSchema],
      default: [],
      validate: {
        validator(images) {
          return images.length <= 4;
        },
        message: "Maximum 4 description images are allowed.",
      },
    },

    // Pricing
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: null,
      min: 0,
      validate: {
        validator(value) {
          return value === null || value <= this.price;
        },
        message: "Discount price cannot be greater than price.",
      },
    },

    // Inventory
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    trackInventory: {
      type: Boolean,
      default: true,
    },

    // Optional Pack Variants
    variants: {
      type: [variantSchema],
      default: [],
    },

    // Batch and Expiry Information
    batchNumber: {
      type: String,
      trim: true,
      default: "",
    },

    manufacturingDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },

    // Availability
    isAvailable: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "active",
      index: true,
    },

    // Ratings
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Sales Analytics
    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // SEO
    metaTitle: {
      type: String,
      default: "",
      trim: true,
    },

    metaDescription: {
      type: String,
      default: "",
      trim: true,
    },

    // Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Text Search
medicineProductSchema.index({
  productName: "text",
  description: "text",
  brand: "text",
  manufacturer: "text",
  composition: "text",
});

// Compound Indexes
medicineProductSchema.index({
  sellerId: 1,
  status: 1,
});

medicineProductSchema.index({
  productCategory: 1,
  productSubCategory: 1,
});

medicineProductSchema.index({
  isAvailable: 1,
  isDeleted: 1,
});

const MedicineProduct =
  mongoose.models.MedicineProduct ||
  mongoose.model("MedicineProduct", medicineProductSchema);

export default MedicineProduct;
