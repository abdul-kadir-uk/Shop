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

// ======================
// GET ALL APPROVED SELLERS (ADMIN)
// ======================

export const getSellers = async (req, res) => {
  try {
    const { search } = req.query;

    const sellers = await Seller.find({
      approvalStatus: "approved",
    }).populate("userId", "name email mobile isBlocked createdAt");

    let data = sellers.map((seller) => ({
      _id: seller._id,
      name: seller.userId.name,
      email: seller.userId.email,
      mobile: seller.userId.mobile,
      shopName: seller.shopName,
      category: seller.category,
      joined: seller.userId.createdAt,
      isBlocked: seller.userId.isBlocked,
      status: seller.userId.isBlocked ? "Blocked" : "Active",
    }));

    if (search) {
      const keyword = search.toLowerCase();

      data = data.filter(
        (seller) =>
          seller.name.toLowerCase().includes(keyword) ||
          seller.email.toLowerCase().includes(keyword) ||
          seller.mobile.includes(keyword) ||
          seller.shopName.toLowerCase().includes(keyword),
      );
    }

    data.sort((a, b) => new Date(b.joined) - new Date(a.joined));

    return res.status(200).json({
      success: true,
      count: data.length,
      sellers: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// GET SELLER DETAILS (ADMIN)
// ======================

export const getSellerById = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findById(id).populate(
      "userId",
      "name email mobile role isVerified isBlocked createdAt",
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    return res.status(200).json({
      success: true,
      seller: {
        _id: seller._id,
        userId: seller.userId._id,
        name: seller.userId.name,
        email: seller.userId.email,
        mobile: seller.userId.mobile,
        shopName: seller.shopName,
        category: seller.category,
        address: seller.address,
        approvalStatus: seller.approvalStatus,
        role: seller.userId.role,
        isVerified: seller.userId.isVerified,
        isBlocked: seller.userId.isBlocked,
        joined: seller.userId.createdAt,
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
// BLOCK SELLER (ADMIN)
// ======================

export const blockSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    const user = await User.findById(seller.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: "Seller is already blocked",
      });
    }

    user.isBlocked = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Seller blocked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// UNBLOCK SELLER (ADMIN)
// ======================

export const unblockSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    const user = await User.findById(seller.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: "Seller is already active",
      });
    }

    user.isBlocked = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Seller unblocked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// DELETE SELLER (ADMIN)
// ======================

export const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    await User.findByIdAndDelete(seller.userId);

    await Seller.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Seller deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
