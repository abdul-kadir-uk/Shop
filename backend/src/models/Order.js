// models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroceryProduct",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

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
    orderStatus: {
      type: String,
      enum: [
        "ordered",
        "confirmed",
        "notAvailable",
        "outForDelivery",
        "delivered",
        "cancelled",
      ],
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

const orderSchema = new mongoose.Schema(
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

export default mongoose.model("Order", orderSchema);
