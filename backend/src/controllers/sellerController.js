import User from "../models/User.js";
import Seller from "../models/Seller.js";

// Seller Dashboard
export const getSellerDashboard = async (req, res) => {
  try {
    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Seller Profile
export const getSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
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

// Update Seller Profile
export const updateSellerProfile = async (req, res) => {
  try {
    const { name, mobile, address, shopName, category } = req.body;

    const user = await User.findById(req.user._id);

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!user || !seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    user.address = address || user.address;

    seller.shopName = shopName || seller.shopName;
    seller.category = category || seller.category;

    await user.save();
    await seller.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
