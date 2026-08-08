// src/controllers/groceryProductController.js
import GroceryProduct from "../models/GroceryProduct.js";

import { generateSlug } from "../utils/generateSlug.js";

import {
  uploadSingleImage,
  replaceImage,
  uploadMultipleImages,
  deleteMultipleImages,
  rollbackUploads,
  deleteSingleImage,
} from "../utils/imageUploadService.js";

export const createGroceryProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const {
      productName,
      description,
      brand,
      productCategory,
      productSubCategory,
      price,
      discountPrice,
      quantity,
      unit,
      stock,
      trackInventory,
      status,
      isAvailable,
      variants,
    } = req.body;

    // ===============================
    // Variants
    // ===============================

    let parsedVariants = [];

    if (variants) {
      parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;

      parsedVariants = parsedVariants.map((variant) => ({
        ...variant,

        quantity: Number(variant.quantity),

        unit: variant.unit,

        label: `${variant.quantity} ${variant.unit}`,

        price: Number(variant.price),

        discountPrice:
          variant.discountPrice === null ? null : Number(variant.discountPrice),

        stock: Number(variant.stock),

        isDefault: Boolean(variant.isDefault),
      }));
    }

    // ===============================
    // Required Fields
    // ===============================

    const hasVariants = parsedVariants && parsedVariants.length > 0;

    if (!productName || !productCategory || !productSubCategory) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    if (!hasVariants && (!price || !quantity || !unit)) {
      return res.status(400).json({
        success: false,
        message: "Please fill price, quantity and unit.",
      });
    }

    // ===============================
    // Main Image
    // ===============================

    if (!req.files?.mainImage?.length) {
      return res.status(400).json({
        success: false,
        message: "Main image is required.",
      });
    }

    const mainImage = await uploadSingleImage(
      req.files.mainImage[0],
      "grocery-products/main",
    );

    uploadedImages.push(mainImage);

    // ===============================
    // Description Images
    // ===============================

    const descriptionImages = await uploadMultipleImages(
      req.files.descriptionImages || [],
      "grocery-products/description",
    );

    uploadedImages.push(...descriptionImages);

    // ===============================
    // Create Product
    // ===============================

    const product = await GroceryProduct.create({
      sellerId: req.seller._id,

      productName,

      slug: generateSlug(productName),

      description,

      brand,

      productCategory,

      productSubCategory,

      mainImage,

      descriptionImages,

      price,

      discountPrice: discountPrice || null,

      quantity,

      unit,

      stock: stock || 0,

      trackInventory: trackInventory ?? true,

      variants: parsedVariants,

      status: status || "active",

      isAvailable: isAvailable ?? true,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    await rollbackUploads(uploadedImages);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// Get Seller Grocery Products
// ======================================================

export const getSellerGroceryProducts = async (req, res) => {
  try {
    const sellerId = req.seller._id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const search = req.query.search || "";
    const category = req.query.category || "";
    const subCategory = req.query.subCategory || "";
    const status = req.query.status || "";

    const skip = (page - 1) * limit;

    const filter = {
      sellerId,
      isDeleted: false,
    };

    // Search
    if (search) {
      filter.$or = [
        {
          productName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Category Filter
    if (category) {
      filter.productCategory = category;
    }

    // Sub Category Filter
    if (subCategory) {
      filter.productSubCategory = subCategory;
    }

    // Status Filter
    if (status) {
      filter.status = status;
    }

    const totalProducts = await GroceryProduct.countDocuments(filter);

    const products = await GroceryProduct.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,

      page,

      limit,

      totalProducts,

      totalPages: Math.ceil(totalProducts / limit),

      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// Get Single Grocery Product
// ======================================================

export const getSellerGroceryProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await GroceryProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// Update Grocery Product
// ======================================================

export const updateGroceryProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const { id } = req.params;

    const product = await GroceryProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const {
      productName,
      description,
      brand,
      productCategory,
      productSubCategory,
      price,
      discountPrice,
      quantity,
      unit,
      stock,
      trackInventory,
      status,
      isAvailable,
      variants,
      keepDescriptionImages,
    } = req.body;

    // ===============================
    // Main Image
    // ===============================

    if (req.files?.mainImage?.length) {
      const newMainImage = await replaceImage(
        product.mainImage,
        req.files.mainImage[0],
        "grocery-products/main",
      );

      uploadedImages.push(newMainImage);

      product.mainImage = newMainImage;
    }

    // ===============================
    // Description Images
    // ===============================

    let keepKeys = [];

    if (keepDescriptionImages) {
      keepKeys =
        typeof keepDescriptionImages === "string"
          ? JSON.parse(keepDescriptionImages)
          : keepDescriptionImages;
    }

    const imagesToDelete = product.descriptionImages.filter(
      (image) => !keepKeys.includes(image.key),
    );

    await deleteMultipleImages(imagesToDelete);

    let newImages = [];

    if (req.files?.descriptionImages?.length) {
      newImages = await uploadMultipleImages(
        req.files.descriptionImages,
        "grocery-products/description",
      );

      uploadedImages.push(...newImages);
    }

    const keptImages = product.descriptionImages.filter((image) =>
      keepKeys.includes(image.key),
    );

    const finalImages = [...keptImages, ...newImages];

    if (finalImages.length > 4) {
      await rollbackUploads(newImages);

      return res.status(400).json({
        success: false,
        message: "Maximum 4 description images are allowed.",
      });
    }

    // ===============================
    // Variants
    // ===============================

    const oldProductName = product.productName;

    let parsedVariants = product.variants;

    console.log("typeof variants:", typeof variants);
    console.log("variants:", variants);

    if (variants !== undefined) {
      parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;

      parsedVariants = parsedVariants.map((variant) => ({
        ...variant,

        quantity: Number(variant.quantity),

        unit: variant.unit,

        label: `${variant.quantity} ${variant.unit}`,

        price: Number(variant.price),

        discountPrice:
          variant.discountPrice === null ? null : Number(variant.discountPrice),

        stock: Number(variant.stock),

        isDefault: Boolean(variant.isDefault),
      }));
    }

    // ===============================
    // Update Product
    // ===============================

    product.productName = productName;

    if (productName !== oldProductName) {
      product.slug = generateSlug(productName);
    }

    product.description = description;
    product.brand = brand;
    product.productCategory = productCategory;
    product.productSubCategory = productSubCategory;

    // ===============================
    // Price / Quantity / Stock
    // ===============================

    if (parsedVariants.length > 0) {
      const defaultVariant =
        parsedVariants.find((variant) => variant.isDefault) ||
        parsedVariants[0];

      product.price = defaultVariant.price;

      product.discountPrice = defaultVariant.discountPrice;

      product.quantity = defaultVariant.quantity;

      product.unit = defaultVariant.unit;

      product.stock = defaultVariant.stock;
    } else {
      product.price = Number(price);

      product.discountPrice = discountPrice ? Number(discountPrice) : null;

      product.quantity = Number(quantity);

      product.unit = unit;

      product.stock = Number(stock);
    }

    // ===============================

    product.trackInventory = trackInventory === "true";
    product.isAvailable = isAvailable === "true";
    product.status = status;

    product.variants = parsedVariants;

    product.descriptionImages = finalImages;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    await rollbackUploads(uploadedImages);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// Delete Grocery Product (Soft Delete)
// ======================================================

export const deleteGroceryProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await GroceryProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Delete images from S3
    await deleteSingleImage(product.mainImage);

    await deleteMultipleImages(product.descriptionImages);

    // Soft Delete
    product.isDeleted = true;
    product.deletedAt = new Date();

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
