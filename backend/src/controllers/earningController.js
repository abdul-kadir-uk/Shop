// controllers/earningController.js

import DeliveryPartner from "../models/DeliveryPartner.js";
import DeliveryEarning from "../models/DeliveryEarning.js";

// ==================================================
// Delivery partner - Get daily earnings
// ==================================================

export const getMyDailyDeliveryEarnings = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can access their earnings.",
      });
    }

    // --------------------------------------------------
    // Find delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findOne({
      userId: req.user._id,
    });

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found.",
      });
    }

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = 5;

    const skip = (page - 1) * limit;

    // --------------------------------------------------
    // Group earnings by date
    //
    // Asia/Kolkata is important because MongoDB stores
    // Date values internally in UTC.
    // --------------------------------------------------

    const dailyEarnings = await DeliveryEarning.aggregate([
      {
        $match: {
          deliveryPartner: deliveryPartner._id,
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$completedAt",
              timezone: "Asia/Kolkata",
            },
          },

          totalOrders: {
            $sum: 1,
          },

          totalEarnings: {
            $sum: "$amount",
          },

          pendingCount: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "pending"],
                },
                1,
                0,
              ],
            },
          },

          paidCount: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "paid"],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      // --------------------------------------------------
      // Newest date first
      // --------------------------------------------------

      {
        $sort: {
          _id: -1,
        },
      },

      // --------------------------------------------------
      // Return only 5 days
      // --------------------------------------------------

      {
        $skip: skip,
      },

      {
        $limit: limit,
      },
    ]);

    // --------------------------------------------------
    // Format response
    // --------------------------------------------------

    const data = dailyEarnings.map((day) => ({
      date: day._id,

      totalOrders: day.totalOrders,

      totalEarnings: day.totalEarnings,

      paymentStatus: day.pendingCount === 0 ? "paid" : "pending",
    }));

    // --------------------------------------------------
    // Determine whether previous/next pages exist
    // --------------------------------------------------

    const totalDaysResult = await DeliveryEarning.aggregate([
      {
        $match: {
          deliveryPartner: deliveryPartner._id,
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$completedAt",
              timezone: "Asia/Kolkata",
            },
          },
        },
      },

      {
        $count: "totalDays",
      },
    ]);

    const totalDays =
      totalDaysResult.length > 0 ? totalDaysResult[0].totalDays : 0;

    const totalPages = Math.ceil(totalDays / limit);

    return res.status(200).json({
      success: true,

      data,

      pagination: {
        page,
        limit,
        totalDays,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get my daily delivery earnings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery earnings.",
    });
  }
};

// ==================================================
// Admin - Update earning per delivery
// ==================================================

export const updateDeliveryPartnerEarningRate = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update delivery earnings.",
      });
    }

    const { deliveryPartnerId } = req.params;
    const { earningPerDelivery } = req.body;

    // --------------------------------------------------
    // Validate earning
    // --------------------------------------------------

    if (
      earningPerDelivery === undefined ||
      earningPerDelivery === null ||
      Number.isNaN(Number(earningPerDelivery)) ||
      Number(earningPerDelivery) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid earning per delivery is required.",
      });
    }

    // --------------------------------------------------
    // Update delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
      deliveryPartnerId,
      {
        earningPerDelivery: Number(earningPerDelivery),
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery earning rate updated successfully.",
      earningPerDelivery: deliveryPartner.earningPerDelivery,
    });
  } catch (error) {
    console.error("Update delivery partner earning rate error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery earning rate.",
    });
  }
};

// ==================================================
// Admin - Mark entire day's earnings as paid
// ==================================================

export const markDeliveryDayEarningsAsPaid = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can mark earnings as paid.",
      });
    }

    const { deliveryPartnerId } = req.params;
    const { date } = req.body;

    // --------------------------------------------------
    // Validate date
    //
    // Expected:
    // YYYY-MM-DD
    // --------------------------------------------------

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid date in YYYY-MM-DD format is required.",
      });
    }

    // --------------------------------------------------
    // Validate delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    // --------------------------------------------------
    // Convert India date to UTC range
    //
    // India:
    // UTC +05:30
    //
    // Example:
    // 2026-08-20 00:00 IST
    // =
    // 2026-08-19 18:30 UTC
    // --------------------------------------------------

    const startOfDay = new Date(`${date}T00:00:00+05:30`);

    const startOfNextDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // --------------------------------------------------
    // Find pending earnings for this delivery partner
    // on this particular Indian calendar day
    // --------------------------------------------------

    const pendingEarnings = await DeliveryEarning.find({
      deliveryPartner: deliveryPartner._id,

      status: "pending",

      completedAt: {
        $gte: startOfDay,
        $lt: startOfNextDay,
      },
    });

    // --------------------------------------------------
    // Nothing pending
    // --------------------------------------------------

    if (pendingEarnings.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No pending earnings found for this delivery partner on this date.",
      });
    }

    // --------------------------------------------------
    // Mark ALL earnings for that day as paid
    // --------------------------------------------------

    const result = await DeliveryEarning.updateMany(
      {
        deliveryPartner: deliveryPartner._id,

        status: "pending",

        completedAt: {
          $gte: startOfDay,
          $lt: startOfNextDay,
        },
      },
      {
        $set: {
          status: "paid",
        },
      },
    );

    // --------------------------------------------------
    // Calculate paid amount
    // --------------------------------------------------

    const totalEarnings = pendingEarnings.reduce(
      (total, earning) => total + earning.amount,
      0,
    );

    return res.status(200).json({
      success: true,

      message: "Entire day's delivery earnings marked as paid.",

      data: {
        date,
        totalOrders: result.modifiedCount,
        totalEarnings,
        paymentStatus: "paid",
      },
    });
  } catch (error) {
    console.error("Mark delivery day earnings as paid error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark delivery day earnings as paid.",
    });
  }
};

// ==================================================
// Admin - Get all delivery partner earnings for a day
// ==================================================

export const getAllDeliveryPartnerDailyEarnings = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access delivery earnings.",
      });
    }

    // --------------------------------------------------
    // Get date
    //
    // Expected:
    // YYYY-MM-DD
    // --------------------------------------------------

    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid date in YYYY-MM-DD format is required.",
      });
    }

    // --------------------------------------------------
    // Convert India date to UTC range
    //
    // Example:
    // 2026-08-20 00:00 IST
    // =
    // 2026-08-19 18:30 UTC
    // --------------------------------------------------

    const startOfDay = new Date(`${date}T00:00:00+05:30`);

    const startOfNextDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // --------------------------------------------------
    // Get all earnings for this Indian calendar day
    // --------------------------------------------------

    const earnings = await DeliveryEarning.aggregate([
      {
        $match: {
          completedAt: {
            $gte: startOfDay,
            $lt: startOfNextDay,
          },
        },
      },

      // --------------------------------------------------
      // Group by delivery partner
      // --------------------------------------------------

      {
        $group: {
          _id: "$deliveryPartner",

          totalOrders: {
            $sum: 1,
          },

          totalEarnings: {
            $sum: "$amount",
          },

          pendingCount: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "pending"],
                },
                1,
                0,
              ],
            },
          },

          paidCount: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "paid"],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      // --------------------------------------------------
      // Get delivery partner details
      // --------------------------------------------------

      {
        $lookup: {
          from: "deliverypartners",
          localField: "_id",
          foreignField: "_id",
          as: "deliveryPartner",
        },
      },

      {
        $unwind: "$deliveryPartner",
      },

      // --------------------------------------------------
      // Get user details
      //
      // DeliveryPartner stores userId, while the actual
      // partner name/mobile is normally stored in User.
      // --------------------------------------------------

      {
        $lookup: {
          from: "users",
          localField: "deliveryPartner.userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      // --------------------------------------------------
      // Sort highest earning first
      // --------------------------------------------------

      {
        $sort: {
          totalEarnings: -1,
        },
      },
    ]);

    // --------------------------------------------------
    // Format response
    // --------------------------------------------------

    const data = earnings.map((earning) => ({
      deliveryPartnerId: earning._id,

      name:
        earning.user?.name ||
        earning.deliveryPartner?.name ||
        "Unknown Delivery Partner",

      mobile: earning.user?.mobile || earning.deliveryPartner?.mobile || "",

      totalOrders: earning.totalOrders,

      totalEarnings: earning.totalEarnings,

      paymentStatus: earning.pendingCount === 0 ? "paid" : "pending",
    }));

    // --------------------------------------------------
    // Calculate date totals
    // --------------------------------------------------

    const totalOrders = data.reduce(
      (total, partner) => total + partner.totalOrders,
      0,
    );

    const totalEarnings = data.reduce(
      (total, partner) => total + partner.totalEarnings,
      0,
    );

    const pendingPartners = data.filter(
      (partner) => partner.paymentStatus === "pending",
    ).length;

    const paidPartners = data.filter(
      (partner) => partner.paymentStatus === "paid",
    ).length;

    // --------------------------------------------------
    // Return response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      date,

      data,

      summary: {
        totalDeliveryPartners: data.length,
        totalOrders,
        totalEarnings,
        pendingPartners,
        paidPartners,
      },
    });
  } catch (error) {
    console.error("Get all delivery partner daily earnings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery partner earnings.",
    });
  }
};
