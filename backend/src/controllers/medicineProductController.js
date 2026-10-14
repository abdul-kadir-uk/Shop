// src/controllers/medicineProductController.js

import MedicineProduct from "../models/MedicineProduct.js";
import { generateSlug } from "../utils/generateSlug.js";
import {
  uploadSingleImage,
  replaceImage,
  uploadMultipleImages,
  deleteMultipleImages,
  rollbackUploads,
  deleteSingleImage,
} from "../utils/imageUploadService.js";

// Convert multipart/form-data boolean values safely.
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return value === "true" || value === "1";
};

// Empty date fields should be stored as null, not Invalid Date.
const parseOptionalDate = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

// Parse medicine variants from JSON or an array.
const parseVariants = (variants) => {
  if (variants === undefined || variants === null || variants === "") {
    return [];
  }

  const parsed = typeof variants === "string" ? JSON.parse(variants) : variants;

  if (!Array.isArray(parsed)) {
    throw new Error("Variants must be an array.");
  }

  return parsed.map((variant) => ({
    quantity: Number(variant.quantity),
    unit: variant.unit,
    label: `${variant.quantity} ${variant.unit}`,
    price: Number(variant.price),
    discountPrice:
      variant.discountPrice === null ||
      variant.discountPrice === undefined ||
      variant.discountPrice === ""
        ? null
        : Number(variant.discountPrice),
    stock:
      variant.stock === undefined || variant.stock === ""
        ? 0
        : Number(variant.stock),
    isDefault: parseBoolean(variant.isDefault, false),
  }));
};

// Create medicine product
export const createMedicineProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const {
      productName,
      description,
      brand,
      manufacturer,
      productCategory,
      productSubCategory,
      composition,
      strength,
      dosageForm,
      packSize,
      requiresPrescription,
      batchNumber,
      manufacturingDate,
      expiryDate,
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

    const parsedVariants = parseVariants(variants);
    const hasVariants = parsedVariants.length > 0;

    if (!productName || !productCategory || !productSubCategory) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    if (
      !hasVariants &&
      (price === undefined ||
        price === "" ||
        quantity === undefined ||
        quantity === "" ||
        !unit)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill price, quantity and unit.",
      });
    }

    if (!req.files?.mainImage?.length) {
      return res.status(400).json({
        success: false,
        message: "Main image is required.",
      });
    }

    // Upload main image
    const mainImage = await uploadSingleImage(
      req.files.mainImage[0],
      "medicine-products/main",
    );

    uploadedImages.push(mainImage);

    // Upload description images
    const descriptionImages = await uploadMultipleImages(
      req.files.descriptionImages || [],
      "medicine-products/description",
    );

    uploadedImages.push(...descriptionImages);

    // Determine product values from the default variant when available.
    const defaultVariant = hasVariants
      ? parsedVariants.find((variant) => variant.isDefault) || parsedVariants[0]
      : null;

    const medicineProduct = await MedicineProduct.create({
      sellerId: req.seller._id,

      productName,
      slug: generateSlug(productName),
      description,
      brand,
      manufacturer,

      productCategory,
      productSubCategory,

      composition,
      strength,
      dosageForm,
      packSize,
      requiresPrescription: parseBoolean(requiresPrescription, false),

      batchNumber,
      manufacturingDate: parseOptionalDate(manufacturingDate),
      expiryDate: parseOptionalDate(expiryDate),

      mainImage,
      descriptionImages,

      price: defaultVariant ? defaultVariant.price : Number(price),
      discountPrice: defaultVariant
        ? defaultVariant.discountPrice
        : discountPrice === undefined ||
            discountPrice === null ||
            discountPrice === ""
          ? null
          : Number(discountPrice),

      quantity: defaultVariant ? defaultVariant.quantity : Number(quantity),

      unit: defaultVariant ? defaultVariant.unit : unit,

      stock: defaultVariant
        ? defaultVariant.stock
        : stock === undefined || stock === ""
          ? 0
          : Number(stock),

      trackInventory: parseBoolean(trackInventory, true),
      variants: parsedVariants,

      status: status || "active",
      isAvailable: parseBoolean(isAvailable, true),
    });

    return res.status(201).json({
      success: true,
      message: "Medicine product created successfully.",
      product: medicineProduct,
    });
  } catch (error) {
    await rollbackUploads(uploadedImages);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get seller's medicine products
export const getSellerMedicineProducts = async (req, res) => {
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

    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
        { composition: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.productCategory = category;
    }

    if (subCategory) {
      filter.productSubCategory = subCategory;
    }

    if (status) {
      filter.status = status;
    }

    const totalProducts = await MedicineProduct.countDocuments(filter);

    const products = await MedicineProduct.find(filter)
      .sort({ createdAt: -1 })
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

// Get one medicine product belonging to the logged-in seller
export const getSellerMedicineProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await MedicineProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update medicine product
export const updateMedicineProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const { id } = req.params;

    const product = await MedicineProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Medicine product not found.",
      });
    }

    const {
      productName,
      description,
      brand,
      manufacturer,
      productCategory,
      productSubCategory,
      composition,
      strength,
      dosageForm,
      packSize,
      requiresPrescription,
      batchNumber,
      manufacturingDate,
      expiryDate,
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

    // Replace main image if a new one was uploaded.
    if (req.files?.mainImage?.length) {
      const newMainImage = await replaceImage(
        product.mainImage,
        req.files.mainImage[0],
        "medicine-products/main",
      );

      uploadedImages.push(newMainImage);
      product.mainImage = newMainImage;
    }

    // Keep existing description images selected by their S3 keys.
    let keepKeys = [];

    if (keepDescriptionImages !== undefined) {
      keepKeys =
        typeof keepDescriptionImages === "string"
          ? JSON.parse(keepDescriptionImages)
          : keepDescriptionImages;

      if (!Array.isArray(keepKeys)) {
        keepKeys = [];
      }
    } else if (!req.files?.descriptionImages?.length) {
      // If no image-selection field and no new images are sent,
      // preserve the existing description images.
      keepKeys = product.descriptionImages.map((image) => image.key);
    }

    const imagesToDelete = product.descriptionImages.filter(
      (image) => !keepKeys.includes(image.key),
    );

    await deleteMultipleImages(imagesToDelete);

    // Upload new description images.
    const newImages = [];

    if (req.files?.descriptionImages?.length) {
      const uploadedDescriptionImages = await uploadMultipleImages(
        req.files.descriptionImages,
        "medicine-products/description",
      );

      newImages.push(...uploadedDescriptionImages);
      uploadedImages.push(...uploadedDescriptionImages);
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

    const oldProductName = product.productName;

    // Keep existing variants when the request does not include them.
    let parsedVariants = product.variants;

    if (variants !== undefined) {
      parsedVariants = parseVariants(variants);
    }

    if (productName !== undefined && productName !== "") {
      product.productName = productName;

      if (oldProductName !== productName) {
        product.slug = generateSlug(productName);
      }
    }

    if (description !== undefined) product.description = description;
    if (brand !== undefined) product.brand = brand;
    if (manufacturer !== undefined) product.manufacturer = manufacturer;

    if (productCategory !== undefined) {
      product.productCategory = productCategory;
    }

    if (productSubCategory !== undefined) {
      product.productSubCategory = productSubCategory;
    }

    if (composition !== undefined) product.composition = composition;
    if (strength !== undefined) product.strength = strength;
    if (dosageForm !== undefined) product.dosageForm = dosageForm;
    if (packSize !== undefined) product.packSize = packSize;

    if (requiresPrescription !== undefined) {
      product.requiresPrescription = parseBoolean(
        requiresPrescription,
        product.requiresPrescription,
      );
    }

    if (batchNumber !== undefined) {
      product.batchNumber = batchNumber;
    }

    if (manufacturingDate !== undefined) {
      product.manufacturingDate = parseOptionalDate(manufacturingDate);
    }

    if (expiryDate !== undefined) {
      product.expiryDate = parseOptionalDate(expiryDate);
    }

    // Update pricing and quantity from the selected default variant,
    // or from the regular product fields when no variants exist.
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
      if (price !== undefined && price !== "") {
        product.price = Number(price);
      }

      if (discountPrice !== undefined) {
        product.discountPrice =
          discountPrice === "" || discountPrice === null
            ? null
            : Number(discountPrice);
      }

      if (quantity !== undefined && quantity !== "") {
        product.quantity = Number(quantity);
      }

      if (unit !== undefined && unit !== "") {
        product.unit = unit;
      }

      if (stock !== undefined && stock !== "") {
        product.stock = Number(stock);
      }
    }

    if (trackInventory !== undefined) {
      product.trackInventory = parseBoolean(
        trackInventory,
        product.trackInventory,
      );
    }

    if (isAvailable !== undefined) {
      product.isAvailable = parseBoolean(isAvailable, product.isAvailable);
    }

    if (status !== undefined && status !== "") {
      product.status = status;
    }

    product.variants = parsedVariants;
    product.descriptionImages = finalImages;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Medicine product updated successfully.",
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

// Soft-delete medicine product
export const deleteMedicineProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await MedicineProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Medicine product not found.",
      });
    }

    await deleteSingleImage(product.mainImage);
    await deleteMultipleImages(product.descriptionImages);

    product.isDeleted = true;
    product.deletedAt = new Date();

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Medicine product deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
