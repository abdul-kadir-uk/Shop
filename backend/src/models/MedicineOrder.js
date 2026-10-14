// src/models/MedicineOrder.js

import mongoose from "mongoose";

const ORDER_STATUSES = [
  "ordered",
  "confirmed",
  "notAvailable",
  "outForDelivery",
  "delivered",
  "cancelled",
];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineProduct",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    // Medicine pack variant
    variantIndex: {
      type: Number,
      default: -1,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Snapshot Data
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

    // Medicine details captured when the order is placed
    composition: {
      type: String,
      default: "",
    },

    strength: {
      type: String,
      default: "",
    },

    dosageForm: {
      type: String,
      default: "",
    },

    packSize: {
      type: String,
      default: "",
    },

    requiresPrescription: {
      type: Boolean,
      default: false,
    },

    variant: {
      quantity: {
        type: Number,
      },

      unit: {
        type: String,
        default: "",
      },

      label: {
        type: String,
        default: "",
      },
    },

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

    // Item-level status
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

const medicineOrderSchema = new mongoose.Schema(
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

    // Overall order status
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "ordered",
    },

    // All medicines belonging to this order
    items: [orderItemSchema],

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

      promoCode: {
        type: String,
        default: null,
      },

      promoDiscount: {
        type: Number,
        default: 0,
        min: 0,
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

const MedicineOrder =
  mongoose.models.MedicineOrder ||
  mongoose.model("MedicineOrder", medicineOrderSchema);

export default MedicineOrder;
