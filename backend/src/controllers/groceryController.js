// controllers/groceryController.js
import GroceryProduct from "../models/GroceryProduct.js";

// ======================================================
// Get All Public Grocery Products
// GET /api/products
// ======================================================

export const getAllGroceries = async (req, res) => {
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

    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);

    const sort = req.query.sort || "latest";

    // -----------------------------
    // Base Filter
    // -----------------------------
    const match = {
      isDeleted: false,
      isAvailable: true,
    };

    // -----------------------------
    // Search
    // -----------------------------
    if (search) {
      match.$text = {
        $search: search,
      };
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
    // Brand
    // -----------------------------
    if (brand) {
      match.brand = brand;
    }

    // -----------------------------
    // Price Filter
    // -----------------------------
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      match.price = {};

      if (!isNaN(minPrice)) {
        match.price.$gte = minPrice;
      }

      if (!isNaN(maxPrice)) {
        match.price.$lte = maxPrice;
      }
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
        sortStage = {
          discountPrice: 1,
        };
        break;

      case "name_asc":
        sortStage = {
          productName: 1,
        };
        break;

      case "name_desc":
        sortStage = {
          productName: -1,
        };
        break;

      default:
        sortStage = {
          createdAt: -1,
        };
    }

    const products = await GroceryProduct.find(match)
      .select(
        "slug productName brand productCategory productSubCategory price discountPrice quantity unit averageRating totalRatings totalSold mainImage isAvailable",
      )
      .sort(sortStage)
      .skip(skip)
      .limit(limit);

    const totalProducts = await GroceryProduct.countDocuments(match);

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
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
};

// ======================================================
// Get Single Public Grocery Product
// GET /api/groceries/:slug
// ======================================================

export const getSingleGrocery = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await GroceryProduct.findOne({
      slug,
      isDeleted: false,
      isAvailable: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product.",
    });
  }
};
