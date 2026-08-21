// models/Cart.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
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

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Future support for product variants
    variantIndex: {
      type: Number,
      default: -1,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },

    items: [cartItemSchema],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Cart", cartSchema);
