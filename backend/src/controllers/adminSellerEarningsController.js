// controllers/adminSellerEarningsController.js

import mongoose from "mongoose";

import SellerEarning from "../models/SellerEarning.js";
import Seller from "../models/Seller.js";

/* ==========================================================
   Get Seller Earnings
   GET /api/admin/seller-earnings
========================================================== */

export const getAdminSellerEarnings = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Check role
    // ------------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access seller earnings.",
      });
    }

    // ------------------------------------------------------
    // Pagination
    //
    // Admin page also uses 7 records per page.
    //
    // IMPORTANT:
    // This pagination is over earnings records, not
    // calendar days globally.
    //
    // Seller filtering can be added using sellerId.
    // ------------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 7, 1);
    const skip = (page - 1) * limit;

    // ------------------------------------------------------
    // Optional seller filter
    // ------------------------------------------------------

    const sellerId = req.query.sellerId || "";

    const query = {};

    if (sellerId) {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid seller id.",
        });
      }

      query.seller = sellerId;
    }

    // ------------------------------------------------------
    // Optional payment status filter
    // ------------------------------------------------------

    const paymentStatus = req.query.paymentStatus || "";

    if (paymentStatus) {
      if (!["pending", "settled"].includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status.",
        });
      }

      query.paymentStatus = paymentStatus;
    }

    // ------------------------------------------------------
    // Optional date filter
    //
    // This is only added for the admin seller earnings page.
    // Existing behavior remains unchanged when date is not
    // provided.
    // ------------------------------------------------------

    const date = req.query.date || "";

    if (date) {
      // Validate YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date. Use YYYY-MM-DD format.",
        });
      }

      // Validate that the date is actually valid.
      const parsedDate = new Date(`${date}T00:00:00.000Z`);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid date.",
        });
      }

      // ----------------------------------------------------
      // Match the earning date exactly for the selected day.
      //
      // This handles SellerEarning.date whether it is stored
      // as a Date at midnight or as a date value.
      // ----------------------------------------------------

      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      query.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // ------------------------------------------------------
    // Count
    // ------------------------------------------------------

    const totalEarnings = await SellerEarning.countDocuments(query);

    // ------------------------------------------------------
    // Summary
    //
    // IMPORTANT:
    // Summary is calculated from ALL matching earnings
    // records before pagination.
    //
    // This means the frontend can display accurate totals
    // for the selected date instead of only the current
    // page of 7 records.
    // ------------------------------------------------------

    const summaryRecords = await SellerEarning.find(query)
      .select("seller openProducts packetProducts total paymentStatus")
      .lean();

    const summary = {
      totalSellers: summaryRecords.length,

      openProductsSold: 0,
      openProductsSales: 0,

      packetProductsSold: 0,
      packetProductsSales: 0,

      totalProductsSold: 0,
      totalSales: 0,

      pendingSellers: 0,
      settledSellers: 0,
    };

    summaryRecords.forEach((earning) => {
      summary.openProductsSold += Number(
        earning.openProducts?.productsSold || 0,
      );

      summary.openProductsSales += Number(
        earning.openProducts?.totalSales || 0,
      );

      summary.packetProductsSold += Number(
        earning.packetProducts?.productsSold || 0,
      );

      summary.packetProductsSales += Number(
        earning.packetProducts?.totalSales || 0,
      );

      summary.totalProductsSold += Number(earning.total?.productsSold || 0);

      summary.totalSales += Number(earning.total?.totalSales || 0);

      if (earning.paymentStatus === "settled") {
        summary.settledSellers += 1;
      } else {
        summary.pendingSellers += 1;
      }
    });

    // ------------------------------------------------------
    // Get earnings
    // ------------------------------------------------------

    const earnings = await SellerEarning.find(query)
      .populate({
        path: "seller",
        select: "shopName userId",
      })
      .populate({
        path: "settledBy",
        select: "name email",
      })
      .sort({
        date: -1,
        seller: 1,
      })
      .skip(skip)
      .limit(limit);

    // ------------------------------------------------------
    // Format response
    // ------------------------------------------------------

    const formattedEarnings = earnings.map((earning) => ({
      _id: earning._id,

      seller: earning.seller
        ? {
            _id: earning.seller._id,
            shopName: earning.seller.shopName,
            userId: earning.seller.userId,
          }
        : null,

      date: earning.date,

      openProducts: {
        productsSold: earning.openProducts.productsSold,

        totalSales: earning.openProducts.totalSales,
      },

      packetProducts: {
        productsSold: earning.packetProducts.productsSold,

        totalSales: earning.packetProducts.totalSales,
      },

      total: {
        productsSold: earning.total.productsSold,

        totalSales: earning.total.totalSales,
      },

      paymentStatus: earning.paymentStatus,

      settledAt: earning.settledAt,

      settledBy: earning.settledBy
        ? {
            _id: earning.settledBy._id,
            name: earning.settledBy.name,
            email: earning.settledBy.email,
          }
        : null,

      createdAt: earning.createdAt,

      updatedAt: earning.updatedAt,
    }));

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      page,

      limit,

      totalEarnings,

      totalPages: Math.ceil(totalEarnings / limit),

      // ----------------------------------------------------
      // Added summary.
      // Existing response fields above remain unchanged.
      // ----------------------------------------------------

      summary,

      earnings: formattedEarnings,
    });
  } catch (error) {
    console.error("Admin Seller Earnings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller earnings.",
    });
  }
};

/* ==========================================================
   Update Seller Earnings Payment Status
   PATCH /api/admin/seller-earnings/:earningId/status
========================================================== */

export const updateSellerEarningPaymentStatus = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Check role
    // ------------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update seller payment status.",
      });
    }

    // ------------------------------------------------------
    // Params / body
    // ------------------------------------------------------

    const { earningId } = req.params;

    const { paymentStatus } = req.body;

    // ------------------------------------------------------
    // Validate earning ID
    // ------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(earningId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid earning id.",
      });
    }

    // ------------------------------------------------------
    // Validate payment status
    // ------------------------------------------------------

    if (!["pending", "settled"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Payment status must be pending or settled.",
      });
    }

    // ------------------------------------------------------
    // Find earning
    // ------------------------------------------------------

    const earning = await SellerEarning.findById(earningId);

    if (!earning) {
      return res.status(404).json({
        success: false,
        message: "Seller earning not found.",
      });
    }

    // ------------------------------------------------------
    // Update settlement status
    // ------------------------------------------------------

    if (paymentStatus === "settled") {
      earning.paymentStatus = "settled";

      earning.settledAt = new Date();

      earning.settledBy = req.user._id;
    } else {
      earning.paymentStatus = "pending";

      earning.settledAt = null;

      earning.settledBy = null;
    }

    // ------------------------------------------------------
    // Save
    // ------------------------------------------------------

    await earning.save();

    // ------------------------------------------------------
    // Populate seller/admin information for response
    // ------------------------------------------------------

    await earning.populate({
      path: "seller",
      select: "shopName userId",
    });

    await earning.populate({
      path: "settledBy",
      select: "name email",
    });

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        paymentStatus === "settled"
          ? "Seller earning marked as settled."
          : "Seller earning marked as pending.",

      earning: {
        _id: earning._id,

        seller: earning.seller
          ? {
              _id: earning.seller._id,
              shopName: earning.seller.shopName,
              userId: earning.seller.userId,
            }
          : null,

        date: earning.date,

        openProducts: earning.openProducts,

        packetProducts: earning.packetProducts,

        total: earning.total,

        paymentStatus: earning.paymentStatus,

        settledAt: earning.settledAt,

        settledBy: earning.settledBy
          ? {
              _id: earning.settledBy._id,
              name: earning.settledBy.name,
              email: earning.settledBy.email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Update Seller Earning Payment Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update seller payment status.",
    });
  }
};
