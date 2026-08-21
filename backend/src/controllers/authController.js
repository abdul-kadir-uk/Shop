// controllers/authController.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import CustomerSignupOtp from "../models/CustomerSignupOtp.js";
import SellerSignupOtp from "../models/SellerSignupOtp.js";
import DeliverySignupOtp from "../models/DeliverySignupOtp.js";
import { sendBlackSmsOtp } from "../services/otp-verification/blackSmsService.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import generateToken, { generateResetToken } from "../utils/jwt.js";
import Customer from "../models/Customer.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Seller from "../models/Seller.js";
import City from "../models/City.js";
import Area from "../models/Area.js";
import { uploadToS3 } from "../utils/s3.js";
import PasswordResetOtp from "../models/PasswordResetOtp.js";

// ======================
// CUSTOMER SIGNUP
// ======================

// ======================
// CUSTOMER SIGNUP - SEND OTP
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

    // --------------------------------------------------
    // Basic validation
    // --------------------------------------------------

    if (
      !name ||
      !email ||
      !mobile ||
      !password ||
      !address ||
      !securityQuestion ||
      !securityAnswer
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.trim();

    // --------------------------------------------------
    // Check existing user
    // --------------------------------------------------

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile Number is Already Registered",
      });
    }

    // --------------------------------------------------
    // Check existing pending OTP
    // --------------------------------------------------

    const existingOtp = await CustomerSignupOtp.findOne({
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });

    // --------------------------------------------------
    // Prevent OTP spam
    // --------------------------------------------------

    if (existingOtp?.lastOtpSentAt) {
      const secondsSinceLastOtp =
        (Date.now() - existingOtp.lastOtpSentAt.getTime()) / 1000;

      if (secondsSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            60 - secondsSinceLastOtp,
          )} seconds before requesting another OTP.`,
        });
      }
    }

    // --------------------------------------------------
    // Generate secure 6 digit OTP
    // --------------------------------------------------

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // --------------------------------------------------
    // Hash password
    // --------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // --------------------------------------------------
    // Hash security answer
    // --------------------------------------------------

    const normalizedAnswer = securityAnswer.trim().toLowerCase();

    const hashedSecurityAnswer = await bcrypt.hash(normalizedAnswer, 10);

    // --------------------------------------------------
    // OTP expires in 5 minutes
    // --------------------------------------------------

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // --------------------------------------------------
    // Save pending signup
    // --------------------------------------------------

    if (existingOtp) {
      existingOtp.name = name;
      existingOtp.email = normalizedEmail;
      existingOtp.mobile = normalizedMobile;
      existingOtp.address = address;
      existingOtp.securityQuestion = securityQuestion;
      existingOtp.securityAnswer = hashedSecurityAnswer;
      existingOtp.password = hashedPassword;
      existingOtp.otpHash = otpHash;
      existingOtp.otpExpiresAt = otpExpiresAt;
      existingOtp.attempts = 0;
      existingOtp.lastOtpSentAt = new Date();

      await existingOtp.save();
    } else {
      await CustomerSignupOtp.create({
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        address,
        securityQuestion,
        securityAnswer: hashedSecurityAnswer,
        password: hashedPassword,
        otpHash,
        otpExpiresAt,
        attempts: 0,
        lastOtpSentAt: new Date(),
      });
    }

    // --------------------------------------------------
    // Send OTP through BlackSMS
    // --------------------------------------------------

    try {
      await sendBlackSmsOtp(normalizedMobile, otp);
    } catch (smsError) {
      // Remove pending signup if SMS failed
      await CustomerSignupOtp.deleteOne({
        mobile: normalizedMobile,
      });

      return res.status(502).json({
        success: false,
        message: smsError.message || "Unable to send OTP. Please try again.",
      });
    }

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your mobile number.",
      mobile: normalizedMobile,
    });
  } catch (error) {
    console.error("Customer signup OTP error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// CUSTOMER SIGNUP - VERIFY OTP
// ======================

export const verifyCustomerSignupOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // --------------------------------------------------
    // Validate input
    // --------------------------------------------------

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
      });
    }

    const normalizedMobile = mobile.trim();

    // --------------------------------------------------
    // Find pending signup
    // --------------------------------------------------

    const pendingSignup = await CustomerSignupOtp.findOne({
      mobile: normalizedMobile,
    });

    if (!pendingSignup) {
      return res.status(404).json({
        success: false,
        message: "OTP session expired. Please start signup again.",
      });
    }

    // --------------------------------------------------
    // Check OTP expiration
    // --------------------------------------------------

    if (pendingSignup.otpExpiresAt < new Date()) {
      await CustomerSignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // --------------------------------------------------
    // Maximum attempts
    // --------------------------------------------------

    if (pendingSignup.attempts >= 5) {
      await CustomerSignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    // --------------------------------------------------
    // Hash submitted OTP
    // --------------------------------------------------

    const submittedOtpHash = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");

    // --------------------------------------------------
    // Verify OTP
    // --------------------------------------------------

    if (submittedOtpHash !== pendingSignup.otpHash) {
      pendingSignup.attempts += 1;

      await pendingSignup.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: Math.max(0, 5 - pendingSignup.attempts),
      });
    }

    // --------------------------------------------------
    // Double check email/mobile before account creation
    // --------------------------------------------------

    const existingUser = await User.findOne({
      $or: [{ email: pendingSignup.email }, { mobile: pendingSignup.mobile }],
    });

    if (existingUser) {
      await CustomerSignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "Email or Mobile Number is Already Registered",
      });
    }

    // --------------------------------------------------
    // Create User
    // --------------------------------------------------

    const user = await User.create({
      role: "customer",
      name: pendingSignup.name,
      email: pendingSignup.email,
      mobile: pendingSignup.mobile,
      password: pendingSignup.password,
      securityQuestion: pendingSignup.securityQuestion,
      securityAnswer: pendingSignup.securityAnswer,

      // OTP successfully verified
      isVerified: true,
    });

    // --------------------------------------------------
    // Create Customer Profile
    // --------------------------------------------------

    const customer = await Customer.create({
      userId: user._id,
      name: pendingSignup.name,
      mobile: pendingSignup.mobile,
      address: pendingSignup.address,
    });

    // --------------------------------------------------
    // Delete pending OTP
    // --------------------------------------------------

    await CustomerSignupOtp.deleteOne({
      _id: pendingSignup._id,
    });

    // --------------------------------------------------
    // Generate login token
    // --------------------------------------------------

    const token = generateToken(user._id);

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user,
      customer,
    });
  } catch (error) {
    console.error("Customer OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// SELLER SIGNUP - SEND OTP
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
    // Basic validation
    // ---------------------------------

    if (
      !name ||
      !email ||
      !mobile ||
      !password ||
      !shopName ||
      !category ||
      !address ||
      !cityId ||
      !gstinNumber ||
      !securityQuestion ||
      !securityAnswer
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.trim();
    const normalizedGstin = gstinNumber.trim().toUpperCase();

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
    // Validate Category
    // ---------------------------------

    if (!["groceries", "mobile-repair"].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller category",
      });
    }

    // ---------------------------------
    // Validate GSTIN
    // ---------------------------------

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

    if (!gstinRegex.test(normalizedGstin)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid GSTIN number",
      });
    }

    // ---------------------------------
    // Check existing user
    // ---------------------------------

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "phone or email already registered",
      });
    }

    // ---------------------------------
    // Check existing pending signup
    // ---------------------------------

    const existingOtp = await SellerSignupOtp.findOne({
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });

    // ---------------------------------
    // Prevent OTP spam
    // ---------------------------------

    if (existingOtp?.lastOtpSentAt) {
      const secondsSinceLastOtp =
        (Date.now() - existingOtp.lastOtpSentAt.getTime()) / 1000;

      if (secondsSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            60 - secondsSinceLastOtp,
          )} seconds before requesting another OTP.`,
        });
      }
    }

    // ---------------------------------
    // Generate secure 6 digit OTP
    // ---------------------------------

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

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
    // OTP expires in 5 minutes
    // ---------------------------------

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ---------------------------------
    // Save pending seller signup
    // ---------------------------------

    if (existingOtp) {
      existingOtp.name = name;
      existingOtp.email = normalizedEmail;
      existingOtp.mobile = normalizedMobile;
      existingOtp.shopName = shopName;
      existingOtp.category = category;
      existingOtp.gstinNumber = normalizedGstin;
      existingOtp.cityId = cityId;
      existingOtp.address = address;
      existingOtp.password = hashedPassword;
      existingOtp.securityQuestion = securityQuestion;
      existingOtp.securityAnswer = hashedSecurityAnswer;
      existingOtp.otpHash = otpHash;
      existingOtp.otpExpiresAt = otpExpiresAt;
      existingOtp.attempts = 0;
      existingOtp.lastOtpSentAt = new Date();

      await existingOtp.save();
    } else {
      await SellerSignupOtp.create({
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        shopName,
        category,
        gstinNumber: normalizedGstin,
        cityId,
        address,
        password: hashedPassword,
        securityQuestion,
        securityAnswer: hashedSecurityAnswer,
        otpHash,
        otpExpiresAt,
        attempts: 0,
        lastOtpSentAt: new Date(),
      });
    }

    // ---------------------------------
    // Send OTP through BlackSMS
    // ---------------------------------

    try {
      await sendBlackSmsOtp(normalizedMobile, otp);
    } catch (smsError) {
      await SellerSignupOtp.deleteOne({
        mobile: normalizedMobile,
      });

      return res.status(502).json({
        success: false,
        message: smsError.message || "Unable to send OTP. Please try again.",
      });
    }

    // ---------------------------------
    // Response
    // ---------------------------------

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your mobile number.",
      mobile: normalizedMobile,
    });
  } catch (error) {
    console.error("Seller signup OTP error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// SELLER SIGNUP - VERIFY OTP
// ======================

export const verifySellerSignupOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // ---------------------------------
    // Validate input
    // ---------------------------------

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
      });
    }

    const normalizedMobile = mobile.trim();

    // ---------------------------------
    // Find pending seller signup
    // ---------------------------------

    const pendingSignup = await SellerSignupOtp.findOne({
      mobile: normalizedMobile,
    });

    if (!pendingSignup) {
      return res.status(404).json({
        success: false,
        message: "OTP session expired. Please start signup again.",
      });
    }

    // ---------------------------------
    // Check OTP expiration
    // ---------------------------------

    if (pendingSignup.otpExpiresAt < new Date()) {
      await SellerSignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // ---------------------------------
    // Maximum attempts
    // ---------------------------------

    if (pendingSignup.attempts >= 5) {
      await SellerSignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    // ---------------------------------
    // Hash submitted OTP
    // ---------------------------------

    const submittedOtpHash = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");

    // ---------------------------------
    // Verify OTP
    // ---------------------------------

    if (submittedOtpHash !== pendingSignup.otpHash) {
      pendingSignup.attempts += 1;

      await pendingSignup.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: Math.max(0, 5 - pendingSignup.attempts),
      });
    }

    // ---------------------------------
    // Validate city again
    // ---------------------------------

    const city = await City.findOne({
      _id: pendingSignup.cityId,
      isActive: true,
    });

    if (!city) {
      await SellerSignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid or inactive city",
      });
    }

    // ---------------------------------
    // Double check existing user
    // ---------------------------------

    const existingUser = await User.findOne({
      $or: [{ email: pendingSignup.email }, { mobile: pendingSignup.mobile }],
    });

    if (existingUser) {
      await SellerSignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "phone or email already registered",
      });
    }

    // ---------------------------------
    // Create User
    // ---------------------------------

    const user = await User.create({
      name: pendingSignup.name,
      email: pendingSignup.email,
      mobile: pendingSignup.mobile,
      password: pendingSignup.password,
      role: "seller",
      securityQuestion: pendingSignup.securityQuestion,
      securityAnswer: pendingSignup.securityAnswer,

      // OTP successfully verified
      isVerified: true,
    });

    // ---------------------------------
    // Create Seller Profile
    // ---------------------------------

    const seller = await Seller.create({
      userId: user._id,
      name: pendingSignup.name,
      shopName: pendingSignup.shopName,
      mobile: pendingSignup.mobile,
      category: pendingSignup.category,
      address: pendingSignup.address,
      gstinNumber: pendingSignup.gstinNumber,

      // Seller location
      city: city._id,

      // Existing seller approval flow
      approvalStatus: "pending",
    });

    // ---------------------------------
    // Delete pending OTP signup
    // ---------------------------------

    await SellerSignupOtp.deleteOne({
      _id: pendingSignup._id,
    });

    // ---------------------------------
    // Response
    // ---------------------------------

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
      },
      seller,
    });
  } catch (error) {
    console.error("Seller OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// DELIVERY PARTNER SIGNUP
// ======================

// ======================
// DELIVERY PARTNER SIGNUP - SEND OTP
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
    // Basic validation
    // ---------------------------------

    if (
      !name ||
      !email ||
      !mobile ||
      !password ||
      !address ||
      !cityId ||
      !securityQuestion ||
      !securityAnswer ||
      !aadhaarNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.trim();
    const normalizedAadhaar = aadhaarNumber.trim();

    // ---------------------------------
    // Validate Mobile
    // ---------------------------------

    if (!/^[0-9]{10}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    // ---------------------------------
    // Validate Aadhaar
    // ---------------------------------

    if (!/^[0-9]{12}$/.test(normalizedAadhaar)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 12-digit Aadhaar number",
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
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile already registered",
      });
    }

    // ---------------------------------
    // Check Existing Aadhaar
    // ---------------------------------

    const existingAadhaar = await DeliveryPartner.findOne({
      aadhaarNumber: normalizedAadhaar,
    });

    if (existingAadhaar) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar already registered",
      });
    }

    // ---------------------------------
    // Check Existing Pending OTP
    // ---------------------------------

    const existingOtp = await DeliverySignupOtp.findOne({
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });

    // ---------------------------------
    // Prevent OTP Spam
    // ---------------------------------

    if (existingOtp?.lastOtpSentAt) {
      const secondsSinceLastOtp =
        (Date.now() - existingOtp.lastOtpSentAt.getTime()) / 1000;

      if (secondsSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            60 - secondsSinceLastOtp,
          )} seconds before requesting another OTP.`,
        });
      }
    }

    // ---------------------------------
    // Generate Secure 6 Digit OTP
    // ---------------------------------

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

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
    // OTP Expires In 5 Minutes
    // ---------------------------------

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ---------------------------------
    // Upload Aadhaar Document To S3
    // ---------------------------------

    const uploadedAadhaar = await uploadToS3(req.file, "delivery/adhaar-docs");

    // ---------------------------------
    // Save Pending Delivery Signup
    // ---------------------------------

    if (existingOtp) {
      existingOtp.name = name;
      existingOtp.email = normalizedEmail;
      existingOtp.mobile = normalizedMobile;
      existingOtp.address = address;
      existingOtp.cityId = cityId;
      existingOtp.aadhaarNumber = normalizedAadhaar;
      existingOtp.aadhaarDocument = uploadedAadhaar.key;
      existingOtp.password = hashedPassword;
      existingOtp.securityQuestion = securityQuestion;
      existingOtp.securityAnswer = hashedSecurityAnswer;
      existingOtp.otpHash = otpHash;
      existingOtp.otpExpiresAt = otpExpiresAt;
      existingOtp.attempts = 0;
      existingOtp.lastOtpSentAt = new Date();

      await existingOtp.save();
    } else {
      await DeliverySignupOtp.create({
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        address,
        cityId,
        aadhaarNumber: normalizedAadhaar,
        aadhaarDocument: uploadedAadhaar.key,
        password: hashedPassword,
        securityQuestion,
        securityAnswer: hashedSecurityAnswer,
        otpHash,
        otpExpiresAt,
        attempts: 0,
        lastOtpSentAt: new Date(),
      });
    }

    // ---------------------------------
    // Send OTP Through BlackSMS
    // ---------------------------------

    try {
      await sendBlackSmsOtp(normalizedMobile, otp);
    } catch (smsError) {
      await DeliverySignupOtp.deleteOne({
        mobile: normalizedMobile,
      });

      return res.status(502).json({
        success: false,
        message: smsError.message || "Unable to send OTP. Please try again.",
      });
    }

    // ---------------------------------
    // Response
    // ---------------------------------

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your mobile number.",
      mobile: normalizedMobile,
    });
  } catch (error) {
    console.error("Delivery signup OTP error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// DELIVERY PARTNER SIGNUP - VERIFY OTP
// ======================

export const verifyDeliverySignupOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // ---------------------------------
    // Validate Input
    // ---------------------------------

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
      });
    }

    const normalizedMobile = mobile.trim();

    // ---------------------------------
    // Find Pending Signup
    // ---------------------------------

    const pendingSignup = await DeliverySignupOtp.findOne({
      mobile: normalizedMobile,
    });

    if (!pendingSignup) {
      return res.status(404).json({
        success: false,
        message: "OTP session expired. Please start signup again.",
      });
    }

    // ---------------------------------
    // Check OTP Expiration
    // ---------------------------------

    if (pendingSignup.otpExpiresAt < new Date()) {
      await DeliverySignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // ---------------------------------
    // Maximum Attempts
    // ---------------------------------

    if (pendingSignup.attempts >= 5) {
      await DeliverySignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    // ---------------------------------
    // Hash Submitted OTP
    // ---------------------------------

    const submittedOtpHash = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");

    // ---------------------------------
    // Verify OTP
    // ---------------------------------

    if (submittedOtpHash !== pendingSignup.otpHash) {
      pendingSignup.attempts += 1;

      await pendingSignup.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: Math.max(0, 5 - pendingSignup.attempts),
      });
    }

    // ---------------------------------
    // Validate City Again
    // ---------------------------------

    const city = await City.findOne({
      _id: pendingSignup.cityId,
      isActive: true,
    });

    if (!city) {
      await DeliverySignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid or inactive city",
      });
    }

    // ---------------------------------
    // Double Check Existing User
    // ---------------------------------

    const existingUser = await User.findOne({
      $or: [{ email: pendingSignup.email }, { mobile: pendingSignup.mobile }],
    });

    if (existingUser) {
      await DeliverySignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "Email or mobile already registered",
      });
    }

    // ---------------------------------
    // Double Check Aadhaar
    // ---------------------------------

    const existingAadhaar = await DeliveryPartner.findOne({
      aadhaarNumber: pendingSignup.aadhaarNumber,
    });

    if (existingAadhaar) {
      await DeliverySignupOtp.deleteOne({
        _id: pendingSignup._id,
      });

      return res.status(400).json({
        success: false,
        message: "Aadhaar already registered",
      });
    }

    // ---------------------------------
    // Create User
    // ---------------------------------

    const user = await User.create({
      name: pendingSignup.name,
      email: pendingSignup.email,
      mobile: pendingSignup.mobile,
      password: pendingSignup.password,
      role: "delivery",
      securityQuestion: pendingSignup.securityQuestion,
      securityAnswer: pendingSignup.securityAnswer,

      // OTP successfully verified
      isVerified: true,
    });

    // ---------------------------------
    // Create Delivery Partner Profile
    // ---------------------------------

    const deliveryPartner = await DeliveryPartner.create({
      userId: user._id,
      name: pendingSignup.name,
      mobile: pendingSignup.mobile,
      aadhaarNumber: pendingSignup.aadhaarNumber,

      // Existing S3 object key
      aadhaarDocument: pendingSignup.aadhaarDocument,

      address: pendingSignup.address,

      // City selected during registration
      assignedCities: [city._id],

      // Existing approval flow
      approvalStatus: "pending",
    });

    // ---------------------------------
    // Delete Pending OTP Signup
    // ---------------------------------

    await DeliverySignupOtp.deleteOne({
      _id: pendingSignup._id,
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
    console.error("Delivery OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// RESET PASSWORD - SEND MOBILE OTP
// ======================

export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    // --------------------------------------------------
    // Validate mobile
    // --------------------------------------------------

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const normalizedMobile = mobile.trim();

    // --------------------------------------------------
    // Validate mobile format
    // --------------------------------------------------

    if (!/^[0-9]{10}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    // --------------------------------------------------
    // Find user
    // --------------------------------------------------

    const user = await User.findOne({
      mobile: normalizedMobile,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this mobile number",
      });
    }

    // --------------------------------------------------
    // Check existing OTP
    // --------------------------------------------------

    const existingOtp = await PasswordResetOtp.findOne({
      mobile: normalizedMobile,
    });

    // --------------------------------------------------
    // Prevent OTP spam
    // --------------------------------------------------

    if (existingOtp?.lastOtpSentAt) {
      const secondsSinceLastOtp =
        (Date.now() - existingOtp.lastOtpSentAt.getTime()) / 1000;

      if (secondsSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            60 - secondsSinceLastOtp,
          )} seconds before requesting another OTP.`,
        });
      }
    }

    // --------------------------------------------------
    // Generate secure 6 digit OTP
    // --------------------------------------------------

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // --------------------------------------------------
    // OTP expires in 5 minutes
    // --------------------------------------------------

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // --------------------------------------------------
    // Save OTP
    // --------------------------------------------------

    if (existingOtp) {
      existingOtp.otpHash = otpHash;
      existingOtp.otpExpiresAt = otpExpiresAt;
      existingOtp.attempts = 0;
      existingOtp.lastOtpSentAt = new Date();

      await existingOtp.save();
    } else {
      await PasswordResetOtp.create({
        mobile: normalizedMobile,
        otpHash,
        otpExpiresAt,
        attempts: 0,
        lastOtpSentAt: new Date(),
      });
    }

    // --------------------------------------------------
    // Send OTP through BlackSMS
    // --------------------------------------------------

    try {
      await sendBlackSmsOtp(normalizedMobile, otp);
    } catch (smsError) {
      await PasswordResetOtp.deleteOne({
        mobile: normalizedMobile,
      });

      return res.status(502).json({
        success: false,
        message: smsError.message || "Unable to send OTP. Please try again.",
      });
    }

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your mobile number.",
      mobile: normalizedMobile,
    });
  } catch (error) {
    console.error("Password reset OTP send error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// RESET PASSWORD - VERIFY MOBILE OTP
// ======================

export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // --------------------------------------------------
    // Validate input
    // --------------------------------------------------

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
      });
    }

    const normalizedMobile = mobile.trim();

    // --------------------------------------------------
    // Find OTP session
    // --------------------------------------------------

    const pendingOtp = await PasswordResetOtp.findOne({
      mobile: normalizedMobile,
    });

    if (!pendingOtp) {
      return res.status(404).json({
        success: false,
        message: "OTP session expired. Please request a new OTP.",
      });
    }

    // --------------------------------------------------
    // Check OTP expiration
    // --------------------------------------------------

    if (pendingOtp.otpExpiresAt < new Date()) {
      await PasswordResetOtp.deleteOne({
        _id: pendingOtp._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // --------------------------------------------------
    // Maximum attempts
    // --------------------------------------------------

    if (pendingOtp.attempts >= 5) {
      await PasswordResetOtp.deleteOne({
        _id: pendingOtp._id,
      });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    // --------------------------------------------------
    // Hash submitted OTP
    // --------------------------------------------------

    const submittedOtpHash = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");

    // --------------------------------------------------
    // Verify OTP
    // --------------------------------------------------

    if (submittedOtpHash !== pendingOtp.otpHash) {
      pendingOtp.attempts += 1;

      await pendingOtp.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: Math.max(0, 5 - pendingOtp.attempts),
      });
    }

    // --------------------------------------------------
    // Find user again
    // --------------------------------------------------

    const user = await User.findOne({
      mobile: normalizedMobile,
    });

    if (!user) {
      await PasswordResetOtp.deleteOne({
        _id: pendingOtp._id,
      });

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------------------------
    // Delete OTP after successful verification
    // --------------------------------------------------

    await PasswordResetOtp.deleteOne({
      _id: pendingOtp._id,
    });

    // --------------------------------------------------
    // Generate existing reset token
    // --------------------------------------------------

    const resetToken = generateResetToken(user);

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Mobile number verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Password reset OTP verification error:", error);

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
