import mongoose from "mongoose";

const mobileRepairServiceSchema = new mongoose.Schema(
  {
    problemId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const mobileRepairSchema = new mongoose.Schema(
  {
    // The technician who manages this phone model's services.
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    modelName: {
      type: String,
      required: true,
      trim: true,
    },

    services: {
      type: [mobileRepairServiceSchema],
      default: [],

      validate: {
        validator: function (services) {
          const problemIds = services.map((service) =>
            service.problemId.trim().toLowerCase(),
          );

          return new Set(problemIds).size === problemIds.length;
        },
        message: "A repair problem can only be added once per phone model.",
      },
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// One record per technician, brand, and phone model.
mobileRepairSchema.index(
  {
    technicianId: 1,
    brand: 1,
    modelName: 1,
  },
  {
    unique: true,
  },
);

const MobileRepair =
  mongoose.models.MobileRepair ||
  mongoose.model("MobileRepair", mobileRepairSchema);

export default MobileRepair;
