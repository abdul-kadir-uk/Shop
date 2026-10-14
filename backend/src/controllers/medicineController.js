// src/controllers/medicineController.js

import MedicineProduct from "../models/MedicineProduct.js";

// ======================================================
// Get All Public Medicine Products
// GET /api/medicines
// ======================================================

export const getAllMedicines = async (req, res) => {
  try {
    // -----------------------------
    // Query Params
    // -----------------------------
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 12, 1);
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    const category = req.query.category?.trim() || "";
    const subCategory = req.query.subCategory?.trim() || "";
    const brand = req.query.brand?.trim() || "";
    const manufacturer = req.query.manufacturer?.trim() || "";

    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);

    const sort = req.query.sort || "latest";

    // -----------------------------
    // Base Filter
    // -----------------------------
    const match = {
      isDeleted: false,
      isAvailable: true,
      status: "active",
    };

    // -----------------------------
    // Search
    // -----------------------------
    if (search) {
      match.$or = [
        { productName: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
        { composition: { $regex: search, $options: "i" } },
        { strength: { $regex: search, $options: "i" } },
      ];
    }

    // -----------------------------
    // Category
    // -----------------------------
    if (category) {
      match.productCategory = category;
    }

    if (subCategory) {
      match.productSubCategory = subCategory;
    }

    // -----------------------------
    // Brand / Manufacturer
    // -----------------------------
    if (brand) {
      match.brand = brand;
    }

    if (manufacturer) {
      match.manufacturer = manufacturer;
    }

    // -----------------------------
    // Price Filter
    // -----------------------------
    if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
      match.price = {};

      if (req.query.minPrice !== undefined && !isNaN(minPrice)) {
        match.price.$gte = minPrice;
      }

      if (req.query.maxPrice !== undefined && !isNaN(maxPrice)) {
        match.price.$lte = maxPrice;
      }

      if (Object.keys(match.price).length === 0) {
        delete match.price;
      }
    }

    // -----------------------------
    // Prescription Filter
    // -----------------------------
    if (req.query.requiresPrescription !== undefined) {
      match.requiresPrescription = req.query.requiresPrescription === "true";
    }

    // -----------------------------
    // Sorting
    // -----------------------------
    let sortStage = {};

    switch (sort) {
      case "oldest":
        sortStage = { createdAt: 1 };
        break;

      case "price_low":
        sortStage = { price: 1 };
        break;

      case "price_high":
        sortStage = { price: -1 };
        break;

      case "discount":
        sortStage = { discountPrice: 1 };
        break;

      case "name_asc":
        sortStage = { productName: 1 };
        break;

      case "name_desc":
        sortStage = { productName: -1 };
        break;

      default:
        sortStage = { createdAt: -1 };
    }

    // -----------------------------
    // Fetch Products
    // -----------------------------
    const products = await MedicineProduct.find(match)
      .select(
        [
          "slug",
          "productName",
          "brand",
          "manufacturer",
          "productCategory",
          "productSubCategory",
          "composition",
          "strength",
          "dosageForm",
          "packSize",
          "requiresPrescription",
          "price",
          "discountPrice",
          "quantity",
          "unit",
          "averageRating",
          "totalRatings",
          "totalSold",
          "mainImage",
          "isAvailable",
          "expiryDate",
        ].join(" "),
      )
      .sort(sortStage)
      .skip(skip)
      .limit(limit);

    const totalProducts = await MedicineProduct.countDocuments(match);
    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalProducts,
      totalPages,
      products,
    });
  } catch (error) {
    console.error("Get All Medicines Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch medicine products.",
    });
  }
};

// ======================================================
// Get Single Public Medicine Product
// GET /api/medicines/:slug
// ======================================================

export const getSingleMedicine = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await MedicineProduct.findOne({
      slug,
      isDeleted: false,
      isAvailable: true,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Medicine product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Single Medicine Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch medicine product.",
    });
  }
};

// ======================================================
// Calculate Medicine Product Price For Selected Quantity
// POST /api/medicines/:slug/price
// ======================================================

export const calculateMedicineProductPrice = async (req, res) => {
  try {
    const { slug } = req.params;

    const { quantity = 1, variantIndex = -1 } = req.body;

    // ---------------------------------------------
    // Validate quantity
    // ---------------------------------------------
    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    // ---------------------------------------------
    // Find Product
    // ---------------------------------------------
    const product = await MedicineProduct.findOne({
      slug,
      isDeleted: false,
      isAvailable: true,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Medicine product not found.",
      });
    }

    // ---------------------------------------------
    // Get Selected Variant
    // ---------------------------------------------
    let variant;

    if (Number(variantIndex) === -1) {
      // Main product
      variant = {
        quantity: product.quantity,
        unit: product.unit,
        label: `${product.quantity} ${product.unit}`,
        price: product.price,
        discountPrice: product.discountPrice,
      };
    } else {
      const selectedIndex = Number(variantIndex);

      if (
        !Number.isInteger(selectedIndex) ||
        !Array.isArray(product.variants) ||
        selectedIndex < 0 ||
        selectedIndex >= product.variants.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Selected variant not found.",
        });
      }

      variant = product.variants[selectedIndex];
    }

    // ---------------------------------------------
    // Backend Price Calculation
    // ---------------------------------------------
    const sellingPrice =
      variant.discountPrice !== null &&
      variant.discountPrice !== undefined &&
      variant.discountPrice > 0 &&
      variant.discountPrice < variant.price
        ? variant.discountPrice
        : variant.price;

    const subtotal = sellingPrice * requestedQuantity;

    const discount = (variant.price - sellingPrice) * requestedQuantity;

    // ---------------------------------------------
    // Response
    // ---------------------------------------------
    return res.status(200).json({
      success: true,
      data: {
        quantity: requestedQuantity,
        baseQuantity: variant.quantity,
        unit: variant.unit,
        label: variant.label || `${variant.quantity} ${variant.unit}`,
        price: variant.price,
        discountPrice: variant.discountPrice,
        sellingPrice,
        subtotal,
        discount,
        requiresPrescription: product.requiresPrescription,
      },
    });
  } catch (error) {
    console.error("Calculate Medicine Product Price Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate medicine product price.",
    });
  }
};
