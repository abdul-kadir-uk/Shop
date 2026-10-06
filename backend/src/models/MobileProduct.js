// models/MobileProduct.js

import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const mobileProductSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Variant grouping
    variantGroupId: {
      type: String,
      default: null,
      index: true,
    },

    variantName: {
      type: String,
      default: "",
      trim: true,
    },

    // Mobile specifications
    ram: {
      type: String,
      default: "",
      trim: true,
    },

    storage: {
      type: String,
      default: "",
      trim: true,
    },

    processor: {
      type: String,
      default: "",
      trim: true,
    },

    display: {
      type: String,
      default: "",
      trim: true,
    },

    // Detailed specifications
    simCardSlots: {
      type: String,
      default: "",
      trim: true,
    },

    connectorType: {
      type: String,
      default: "",
      trim: true,
    },

    batteryCapacity: {
      type: String,
      default: "",
      trim: true,
    },

    weight: {
      type: String,
      default: "",
      trim: true,
    },

    displayType: {
      type: String,
      default: "",
      trim: true,
    },

    screenSize: {
      type: String,
      default: "",
      trim: true,
    },

    networkSupport: {
      type: String,
      default: "",
      trim: true,
    },

    insideBox: {
      type: String,
      default: "",
      trim: true,
    },

    camera: {
      front: {
        type: String,
        default: "",
        trim: true,
      },

      rear: {
        type: String,
        default: "",
        trim: true,
      },
    },

    operatingSystem: {
      type: String,
      default: "",
      trim: true,
    },

    warranty: {
      type: String,
      default: "",
      trim: true,
    },

    charging: {
      type: String,
      default: "",
      trim: true,
    },

    // Available colours for this variant
    colors: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        // Whether this particular colour is available
        isAvailable: {
          type: Boolean,
          default: true,
        },

        // Optional colour-specific price
        // If null, use the main product price
        price: {
          type: Number,
          default: null,
          min: 0,
        },

        // Colour-specific description images
        descriptionImages: {
          type: [imageSchema],
          default: [],
        },
      },
    ],

    // Images
    mainImage: {
      type: imageSchema,
      required: true,
    },

    // General description images
    // Can be used as fallback when a colour has no images
    descriptionImages: {
      type: [imageSchema],
      default: [],
    },

    // Main product pricing
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

    // Product availability
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Soft delete
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

const MobileProduct = mongoose.model("MobileProduct", mobileProductSchema);

export default MobileProduct;
