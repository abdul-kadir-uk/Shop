import mongoose from "mongoose";

const deliveryEarningSchema = new mongoose.Schema(
  {
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      index: true,
    },

    completedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const DeliveryEarning = mongoose.model(
  "DeliveryEarning",
  deliveryEarningSchema,
);

export default DeliveryEarning;
