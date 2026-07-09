// adminController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/jwt.js";

// ======================
// ADMIN LOGIN
// ======================

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check Admin Email
    const admin = await User.findOne({
      email,
      role: "admin",
      isSystemAdmin: true,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check Role
    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check System Admin
    if (!admin.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate Token
    const token = generateToken(admin._id);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// ADMIN PROFILE
// ======================

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// ADMIN LOGOUT
// ======================

export const adminLogout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
};
