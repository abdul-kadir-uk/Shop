// Area model
import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
      index: true,
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

// An area name must be unique within a city.
// The same area name can exist in different cities.
areaSchema.index(
  {
    city: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("Area", areaSchema);
