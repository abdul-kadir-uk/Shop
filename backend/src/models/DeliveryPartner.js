// models/DeliveryPartner.js
import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    aadhaarNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    aadhaarDocument: {
      type: String,
      required: true,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Cities assigned by admin
    assignedCities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
      },
    ],
    earningPerDelivery: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const DeliveryPartner = mongoose.model(
  "DeliveryPartner",
  deliveryPartnerSchema,
);

export default DeliveryPartner;
