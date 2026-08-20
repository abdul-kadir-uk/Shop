// controllers/sellerEarningsController.js

import Seller from "../models/Seller.js";
import SellerEarning from "../models/SellerEarning.js";
import Order from "../models/Order.js";

/* ==========================================================
   Helpers
========================================================== */

/**
 * Get today's date in India/IST as YYYY-MM-DD.
 */
const getTodayIST = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

/**
 * Convert a Date object into YYYY-MM-DD in IST.
 */
const formatDateIST = (date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
};

/**
 * Add/subtract calendar days from YYYY-MM-DD.
 */
const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
};

/**
 * Convert IST calendar date to UTC start.
 *
 * Example:
 * 2026-08-20
 *
 * becomes:
 * 2026-08-19T18:30:00.000Z
 */
const getISTDayStart = (dateString) => {
  return new Date(`${dateString}T00:00:00+05:30`);
};

/**
 * Convert IST calendar date to UTC end.
 */
const getISTDayEnd = (dateString) => {
  return getISTDayStart(addDays(dateString, 1));
};

/**
 * Round money to two decimal places.
 */
const roundMoney = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/* ==========================================================
   Calculate Seller Earnings For One Day
========================================================== */

/**
 * IMPORTANT:
 *
 * The earnings date comes from Order.createdAt.
 *
 * An item contributes to earnings only when:
 *
 * 1. Order paymentStatus === "paid"
 * 2. Item belongs to this seller
 * 3. Item orderStatus === "delivered"
 *
 * The item's quantity and subtotal are then counted.
 */
const calculateSellerDailyEarnings = async (sellerId, date) => {
  const dayStart = getISTDayStart(date);
  const dayEnd = getISTDayEnd(date);

  const result = await Order.aggregate([
    // ------------------------------------------------------
    // Find orders created on this calendar day.
    // ------------------------------------------------------

    {
      $match: {
        paymentStatus: "paid",

        createdAt: {
          $gte: dayStart,
          $lt: dayEnd,
        },

        items: {
          $elemMatch: {
            seller: sellerId,
            orderStatus: "delivered",
          },
        },
      },
    },

    // ------------------------------------------------------
    // Separate order items.
    // ------------------------------------------------------

    {
      $unwind: "$items",
    },

    // ------------------------------------------------------
    // Only this seller's delivered items.
    // ------------------------------------------------------

    {
      $match: {
        "items.seller": sellerId,
        "items.orderStatus": "delivered",
      },
    },

    // ------------------------------------------------------
    // Get product classification.
    //
    // We need productSubCategory to determine:
    //
    // open-products
    // closed-products
    // ------------------------------------------------------

    {
      $lookup: {
        from: "groceryproducts",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    // ------------------------------------------------------
    // Group by product type.
    // ------------------------------------------------------

    {
      $group: {
        _id: "$product.productSubCategory",

        productsSold: {
          $sum: "$items.quantity",
        },

        totalSales: {
          $sum: "$items.subtotal",
        },
      },
    },
  ]);

  const earnings = {
    openProducts: {
      productsSold: 0,
      totalSales: 0,
    },

    packetProducts: {
      productsSold: 0,
      totalSales: 0,
    },

    total: {
      productsSold: 0,
      totalSales: 0,
    },
  };

  // --------------------------------------------------------
  // Process aggregation.
  // --------------------------------------------------------

  for (const row of result) {
    const productsSold = row.productsSold || 0;
    const totalSales = row.totalSales || 0;

    if (row._id === "open-products") {
      earnings.openProducts.productsSold += productsSold;

      earnings.openProducts.totalSales += totalSales;
    }

    if (row._id === "closed-products") {
      earnings.packetProducts.productsSold += productsSold;

      earnings.packetProducts.totalSales += totalSales;
    }
  }

  // --------------------------------------------------------
  // Daily total.
  // --------------------------------------------------------

  earnings.total.productsSold =
    earnings.openProducts.productsSold + earnings.packetProducts.productsSold;

  earnings.total.totalSales =
    earnings.openProducts.totalSales + earnings.packetProducts.totalSales;

  // --------------------------------------------------------
  // Round money.
  // --------------------------------------------------------

  earnings.openProducts.totalSales = roundMoney(
    earnings.openProducts.totalSales,
  );

  earnings.packetProducts.totalSales = roundMoney(
    earnings.packetProducts.totalSales,
  );

  earnings.total.totalSales = roundMoney(earnings.total.totalSales);

  return earnings;
};

/* ==========================================================
   Get Existing Daily Earning
========================================================== */

const getSellerDailyEarning = async (sellerId, date) => {
  const dateValue = getISTDayStart(date);

  return SellerEarning.findOne({
    seller: sellerId,
    date: dateValue,
  });
};

/* ==========================================================
   Create Daily Earning If There Are Sales
========================================================== */

const getOrCreateSellerDailyEarning = async (sellerId, date) => {
  // --------------------------------------------------------
  // First check whether this day already exists.
  //
  // This is important because an admin may already have
  // settled this record.
  //
  // We must NEVER overwrite paymentStatus here.
  // --------------------------------------------------------

  const existingEarning = await getSellerDailyEarning(sellerId, date);

  if (existingEarning) {
    return existingEarning;
  }

  // --------------------------------------------------------
  // Calculate this day.
  // --------------------------------------------------------

  const calculated = await calculateSellerDailyEarnings(sellerId, date);

  // --------------------------------------------------------
  // If there were no sales, don't create a database record.
  //
  // The API will still return this day with zero values.
  // --------------------------------------------------------

  if (calculated.total.productsSold === 0) {
    return null;
  }

  // --------------------------------------------------------
  // Create the daily earning.
  // --------------------------------------------------------

  try {
    return await SellerEarning.create({
      seller: sellerId,

      date: getISTDayStart(date),

      openProducts: calculated.openProducts,

      packetProducts: calculated.packetProducts,

      total: calculated.total,

      paymentStatus: "pending",

      settledAt: null,

      settledBy: null,
    });
  } catch (error) {
    // ------------------------------------------------------
    // Another request may have created this exact
    // seller/day at the same time.
    //
    // Unique index protects against duplicates.
    // ------------------------------------------------------

    if (error?.code === 11000) {
      return getSellerDailyEarning(sellerId, date);
    }

    throw error;
  }
};

/* ==========================================================
   Format Empty Day
========================================================== */

const createEmptyDay = (date) => {
  return {
    _id: null,

    date: getISTDayStart(date),

    openProducts: {
      productsSold: 0,
      totalSales: 0,
    },

    packetProducts: {
      productsSold: 0,
      totalSales: 0,
    },

    total: {
      productsSold: 0,
      totalSales: 0,
    },

    paymentStatus: "pending",

    settledAt: null,

    createdAt: null,

    updatedAt: null,
  };
};

/* ==========================================================
   Format Existing Earning
========================================================== */

const formatEarning = (earning) => {
  return {
    _id: earning._id,

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

    createdAt: earning.createdAt,

    updatedAt: earning.updatedAt,
  };
};

/* ==========================================================
   Seller Earnings
   GET /api/seller/earnings?page=1
========================================================== */

export const getSellerEarnings = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Check role.
    // ------------------------------------------------------

    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can access earnings.",
      });
    }

    // ------------------------------------------------------
    // Find seller.
    //
    // We need createdAt because it is the earliest day
    // that can appear on the earnings page.
    // ------------------------------------------------------

    const seller = await Seller.findOne({
      userId: req.user._id,
    }).select("_id createdAt");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    // ------------------------------------------------------
    // Pagination.
    //
    // Every page represents seven calendar days.
    // ------------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);

    const daysPerPage = 7;

    // ------------------------------------------------------
    // Current date in IST.
    // ------------------------------------------------------

    const today = getTodayIST();

    // ------------------------------------------------------
    // Seller creation date in IST.
    // ------------------------------------------------------

    const sellerCreatedDate = formatDateIST(seller.createdAt);

    // ------------------------------------------------------
    // Determine how many days have passed since seller
    // creation.
    //
    // Example:
    //
    // Seller created: 18 Aug
    // Today: 20 Aug
    //
    // Available days:
    //
    // 20, 19, 18
    // ------------------------------------------------------

    const todayUTC = new Date(`${today}T00:00:00Z`);

    const sellerCreatedUTC = new Date(`${sellerCreatedDate}T00:00:00Z`);

    const totalAvailableDays =
      Math.floor(
        (todayUTC.getTime() - sellerCreatedUTC.getTime()) /
          (24 * 60 * 60 * 1000),
      ) + 1;

    // ------------------------------------------------------
    // If seller was created in the future because of
    // unexpected data, return no earnings.
    // ------------------------------------------------------

    if (totalAvailableDays <= 0) {
      return res.status(200).json({
        success: true,

        page,

        limit: daysPerPage,

        totalDays: 0,

        totalPages: 0,

        hasNextPage: false,

        hasPreviousPage: false,

        startDate: null,

        endDate: null,

        days: [],
      });
    }

    // ------------------------------------------------------
    // Total number of valid pages.
    //
    // Example:
    //
    // 3 days  -> 1 page
    // 7 days  -> 1 page
    // 8 days  -> 2 pages
    // 14 days -> 2 pages
    // 15 days -> 3 pages
    // ------------------------------------------------------

    const totalPages = Math.ceil(totalAvailableDays / daysPerPage);

    // ------------------------------------------------------
    // If requested page is beyond available pages,
    // return 404 rather than showing irrelevant dates.
    // ------------------------------------------------------

    if (page > totalPages) {
      return res.status(404).json({
        success: false,
        message: "No more earnings available.",
      });
    }

    // ------------------------------------------------------
    // Calculate page date range.
    //
    // Page 1:
    //
    // today -> today - 6
    //
    // Page 2:
    //
    // today - 7 -> today - 13
    //
    // etc.
    // ------------------------------------------------------

    const pageOffset = (page - 1) * daysPerPage;

    const newestDate = addDays(today, -pageOffset);

    let oldestDate = addDays(newestDate, -(daysPerPage - 1));

    // ------------------------------------------------------
    // Never go before seller creation date.
    // ------------------------------------------------------

    if (oldestDate < sellerCreatedDate) {
      oldestDate = sellerCreatedDate;
    }

    // ------------------------------------------------------
    // Build dates from newest -> oldest.
    // ------------------------------------------------------

    const dates = [];

    let currentDate = newestDate;

    while (currentDate >= oldestDate) {
      dates.push(currentDate);

      currentDate = addDays(currentDate, -1);
    }

    // ------------------------------------------------------
    // Get/create earnings for each valid day.
    // ------------------------------------------------------

    const days = [];

    for (const date of dates) {
      const earning = await getOrCreateSellerDailyEarning(seller._id, date);

      if (earning) {
        days.push(formatEarning(earning));
      } else {
        days.push(createEmptyDay(date));
      }
    }

    // ------------------------------------------------------
    // Pagination state.
    //
    // "Next" in the frontend means older data.
    //
    // page 1 -> page 2 -> page 3
    //
    // So:
    //
    // hasNextPage = older page exists
    // hasPreviousPage = newer page exists
    // ------------------------------------------------------

    const hasNextPage = page < totalPages;

    const hasPreviousPage = page > 1;

    // ------------------------------------------------------
    // Response.
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      page,

      limit: daysPerPage,

      totalDays: totalAvailableDays,

      totalPages,

      hasNextPage,

      hasPreviousPage,

      startDate: oldestDate,

      endDate: newestDate,

      days,
    });
  } catch (error) {
    console.error("Seller Earnings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller earnings.",
    });
  }
};
