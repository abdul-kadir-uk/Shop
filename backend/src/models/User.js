// user model
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    securityQuestion: {
      type: String,
      enum: ["pet", "school", "city", "teacher", "mother"],
      default: null,
    },

    securityAnswer: {
      type: String,
      default: null,
      trim: true,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    passwordResetVersion: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["customer", "seller", "delivery", "admin"],
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
    isSystemAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
