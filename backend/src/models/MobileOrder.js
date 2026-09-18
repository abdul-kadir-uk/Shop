// models/MobileOrder.js

import mongoose from "mongoose";

const ORDER_STATUSES = [
  "ordered",
  "confirmed",
  "notAvailable",
  "outForDelivery",
  "delivered",
  "cancelled",
];

const mobileOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MobileProduct",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // --------------------------------------------------
    // Snapshot Data
    // --------------------------------------------------

    productName: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    variant: {
      variantGroupId: {
        type: String,
        default: "",
      },

      variantName: {
        type: String,
        default: "",
      },

      ram: {
        type: String,
        default: "",
      },

      storage: {
        type: String,
        default: "",
      },
    },

    // --------------------------------------------------
    // Color Snapshot
    // --------------------------------------------------

    color: {
      type: String,
      default: "",
      trim: true,
    },

    colorPrice: {
      type: Number,
      default: null,
    },

    // --------------------------------------------------
    // Pricing
    // --------------------------------------------------

    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
      default: null,
    },

    subtotal: {
      type: Number,
      required: true,
    },

    // --------------------------------------------------
    // Item-level status
    // --------------------------------------------------

    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "ordered",
    },

    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const mobileOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    // --------------------------------------------------
    // Parent / overall order status
    // --------------------------------------------------

    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "ordered",
    },

    // --------------------------------------------------
    // Mobile products belonging to this order
    // --------------------------------------------------

    items: [mobileOrderItemSchema],

    shippingAddress: {
      address: {
        type: String,
        required: true,
      },

      city: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "City",
          required: true,
        },

        name: {
          type: String,
          required: true,
        },

        state: {
          type: String,
          required: true,
        },
      },
    },

    deliveryContact: {
      primaryMobile: {
        type: String,
        required: true,
      },

      alternateMobile: {
        type: String,
        default: "",
      },
    },

    pricing: {
      subtotal: {
        type: Number,
        required: true,
      },

      discount: {
        type: Number,
        default: 0,
      },

      deliveryCharge: {
        type: Number,
        default: 0,
      },

      total: {
        type: Number,
        required: true,
      },
    },

    paymentMethod: {
      type: String,
      enum: ["COD"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("MobileOrder", mobileOrderSchema);
