// City modal
import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

citySchema.index(
  {
    name: 1,
    state: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("City", citySchema);
