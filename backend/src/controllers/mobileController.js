// controllers/mobileController.js

import MobileProduct from "../models/MobileProduct.js";

// GET /api/mobiles
// Public - no authentication required
export const getMobileProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      brand,
      ram,
      storage,
      sort = "newest",
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    const skip = (pageNumber - 1) * limitNumber;

    const filter = {
      isDeleted: false,
      isAvailable: true,
    };

    // Search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$or = [
        { productName: searchRegex },
        { brand: searchRegex },
        { variantName: searchRegex },
      ];
    }

    // Brand filter
    if (brand) {
      filter.brand = brand;
    }

    // RAM filter
    if (ram) {
      filter.ram = ram;
    }

    // Storage filter
    if (storage) {
      filter.storage = storage;
    }

    // Sorting
    let sortOption = { createdAt: -1 };

    if (sort === "price-low") {
      sortOption = { price: 1 };
    } else if (sort === "price-high") {
      sortOption = { price: -1 };
    } else if (sort === "popular") {
      sortOption = { totalSold: -1 };
    }

    const [products, total] = await Promise.all([
      MobileProduct.find(filter)
        .select(
          "_id productName slug brand variantGroupId variantName ram storage colors mainImage price discountPrice isAvailable totalSold",
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      MobileProduct.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber < Math.ceil(total / limitNumber),
        hasPreviousPage: pageNumber > 1,
      },
      products,
    });
  } catch (error) {
    console.error("Get mobile products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mobile products",
    });
  }
};

// GET /api/mobiles/:slug
// Public - no authentication required
export const getMobileProduct = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await MobileProduct.findOne({
      slug,
      isDeleted: false,
      isAvailable: true,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Mobile product not found",
      });
    }

    let variants = [];

    // Find all available variants belonging to the same variant group
    if (product.variantGroupId) {
      variants = await MobileProduct.find({
        variantGroupId: product.variantGroupId,
        isDeleted: false,
        isAvailable: true,
      })
        .select(
          "_id slug productName variantName ram storage price discountPrice mainImage",
        )
        .sort({ ram: 1, storage: 1 })
        .lean();
    }

    return res.status(200).json({
      success: true,
      product,
      variants,
    });
  } catch (error) {
    console.error("Get mobile product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mobile product",
    });
  }
};
