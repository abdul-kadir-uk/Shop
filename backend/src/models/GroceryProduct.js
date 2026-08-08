// src/models/GroceryProduct.js

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
    },

    discountPrice: {
      type: Number,
      default: null,
    },

    stock: {
      type: Number,
      default: 0,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const groceryProductSchema = new mongoose.Schema(
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

    // Categories
    productCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    productSubCategory: {
      type: String,
      required: true,
      enum: ["open-products", "closed-products"],
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

    unit: {
      type: String,
      required: true,
      enum: [
        "kg",
        "g",
        "mg",
        "litre",
        "ml",
        "piece",
        "packet",
        "box",
        "dozen",
        "bundle",
      ],
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

    // Variants (Optional)
    variants: {
      type: [variantSchema],
      default: [],
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

    // Ratings (Future)
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

    // Future Sales Analytics
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
groceryProductSchema.index({
  productName: "text",
  description: "text",
  brand: "text",
});

// Compound Indexes
groceryProductSchema.index({
  sellerId: 1,
  status: 1,
});

groceryProductSchema.index({
  productCategory: 1,
  productSubCategory: 1,
});

groceryProductSchema.index({
  isAvailable: 1,
  isDeleted: 1,
});

const GroceryProduct = mongoose.model("GroceryProduct", groceryProductSchema);

export default GroceryProduct;
