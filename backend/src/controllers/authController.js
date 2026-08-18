// controllers/authController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import generateToken, { generateResetToken } from "../utils/jwt.js";
import Customer from "../models/Customer.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Seller from "../models/Seller.js";
import City from "../models/City.js";
import Area from "../models/Area.js";
import { uploadToS3 } from "../utils/s3.js";

// ======================
// CUSTOMER SIGNUP
// ======================

export const customerSignup = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      address,
      securityQuestion,
      securityAnswer,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile Number is Already Registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedAnswer = securityAnswer.trim().toLowerCase();
    const hashedSecurityAnswer = await bcrypt.hash(normalizedAnswer, 10);

    const user = await User.create({
      role: "customer",
      name,
      email,
      mobile,
      password: hashedPassword,
      securityQuestion,
      securityAnswer: hashedSecurityAnswer,
    });

    const customer = await Customer.create({
      userId: user._id,
      name,
      mobile,
      address,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// SELLER SIGNUP
// ======================

export const sellerSignup = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      shopName,
      category,
      address,
      cityId,
      gstinNumber,
      securityQuestion,
      securityAnswer,
    } = req.body;

    // ---------------------------------
    // Validate City
    // ---------------------------------
    const city = await City.findOne({
      _id: cityId,
      isActive: true,
    });

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive city",
      });
    }

    // ---------------------------------
    // Check existing user
    // ---------------------------------
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "phone or email already registered",
      });
    }

    // ---------------------------------
    // Hash password
    // ---------------------------------
    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------------------------------
    // Hash security answer
    // ---------------------------------
    const normalizedAnswer = securityAnswer.trim().toLowerCase();

    const hashedSecurityAnswer = await bcrypt.hash(normalizedAnswer, 10);

    // ---------------------------------
    // Create User
    // ---------------------------------
    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: "seller",
      securityQuestion,
      securityAnswer: hashedSecurityAnswer,
    });

    // ---------------------------------
    // Create Seller Profile
    // ---------------------------------
    const seller = await Seller.create({
      userId: user._id,
      name,
      shopName,
      mobile,
      category,
      address,
      gstinNumber,

      // Seller location
      city: city._id,

      approvalStatus: "pending",
    });

    // ---------------------------------
    // Response
    // ---------------------------------
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      user,
      seller,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// DELIVERY PARTNER SIGNUP
// ======================

export const deliverySignup = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      address,
      cityId,
      securityQuestion,
      securityAnswer,
      aadhaarNumber,
    } = req.body;

    // ---------------------------------
    // Validate Aadhaar Document
    // ---------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar document is required",
      });
    }

    // ---------------------------------
    // Validate City
    // ---------------------------------

    const city = await City.findOne({
      _id: cityId,
      isActive: true,
    });

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive city",
      });
    }

    // ---------------------------------
    // Check Existing User
    // ---------------------------------

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "email or mobile already registered",
      });
    }

    // ---------------------------------
    // Check Aadhaar
    // ---------------------------------

    const existingAadhaar = await DeliveryPartner.findOne({
      aadhaarNumber,
    });

    if (existingAadhaar) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar already registered",
      });
    }

    // ---------------------------------
    // Upload Aadhaar Document to S3
    // ---------------------------------

    const uploadedAadhaar = await uploadToS3(req.file, "delivery/adhaar-docs");

    // ---------------------------------
    // Hash Password
    // ---------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------------------------------
    // Hash Security Answer
    // ---------------------------------

    const normalizedAnswer = securityAnswer.trim().toLowerCase();

    const hashedSecurityAnswer = await bcrypt.hash(normalizedAnswer, 10);

    // ---------------------------------
    // Create User
    // ---------------------------------

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: "delivery",
      securityQuestion,
      securityAnswer: hashedSecurityAnswer,
    });

    // ---------------------------------
    // Create Delivery Partner Profile
    // ---------------------------------

    const deliveryPartner = await DeliveryPartner.create({
      userId: user._id,
      name,
      mobile,
      aadhaarNumber,

      // Save S3 object key
      aadhaarDocument: uploadedAadhaar.key,

      address,

      // City selected during registration
      assignedCities: [city._id],

      approvalStatus: "pending",
    });

    // ---------------------------------
    // Response
    // ---------------------------------

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",

      deliveryPartner: {
        id: deliveryPartner._id,
        userId: deliveryPartner.userId,
        name: deliveryPartner.name,
        mobile: deliveryPartner.mobile,
        address: deliveryPartner.address,
        assignedCities: deliveryPartner.assignedCities,
        approvalStatus: deliveryPartner.approvalStatus,
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
// LOGIN
// ======================

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Login using either email or mobile number
    const loginIdentifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: loginIdentifier }, { mobile: loginIdentifier }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile or password",
      });
    }

    let profile = null;

    switch (user.role) {
      case "customer":
        profile = await Customer.findOne({ userId: user._id });
        break;

      case "seller":
        profile = await Seller.findOne({ userId: user._id });
        break;

      case "delivery":
        profile = await DeliveryPartner.findOne({ userId: user._id });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid user role",
        });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        ...profile.toObject(),
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// verification for reset password
export const verifySecurity = async (req, res) => {
  try {
    const { identifier, securityQuestion, securityAnswer } = req.body;

    const loginIdentifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: loginIdentifier }, { mobile: loginIdentifier }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.securityQuestion !== securityQuestion) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const isAnswerCorrect = await bcrypt.compare(
      securityAnswer.trim().toLowerCase(),
      user.securityAnswer,
    );

    if (!isAnswerCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const resetToken = generateResetToken(user);

    return res.status(200).json({
      success: true,
      message: "Verification successful",
      resetToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// verify current pasword
export const verifyCurrentPassword = async (req, res) => {
  try {
    const { currentPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const resetToken = generateResetToken(user);

    return res.status(200).json({
      success: true,
      message: "Password verified",
      resetToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== "resetPassword") {
      return res.status(401).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if reset token has already been used
    if (decoded.version !== user.passwordResetVersion) {
      return res.status(401).json({
        success: false,
        message: "Reset token has already been used or is invalid.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    // Logout from every device
    user.passwordChangedAt = new Date();

    // Prevent this reset token from being reused
    user.passwordResetVersion += 1;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. Please login again.",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Reset link expired or invalid",
    });
  }
};

// ======================
// LOGOUT
// ======================

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
