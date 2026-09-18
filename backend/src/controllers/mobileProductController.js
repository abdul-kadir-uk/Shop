// controllers/mobileProductController.js

import MobileProduct from "../models/MobileProduct.js";
import { generateSlug } from "../utils/generateSlug.js";

import {
  uploadSingleImage,
  uploadMultipleImages,
  replaceImage,
  deleteSingleImage,
  deleteMultipleImages,
  rollbackUploads,
} from "../utils/imageUploadService.js";

/* ==========================================================
   CREATE MOBILE PRODUCT
========================================================== */

export const createMobileProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const {
      productName,
      brand,
      description,
      variantGroupId,
      variantName,
      ram,
      storage,
      colors,
      processor,
      display,
      camera,
      battery,
      operatingSystem,
      warranty,
      price,
      discountPrice,
      isAvailable,
      charging,
    } = req.body;

    /* -------------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------------- */

    if (!productName?.trim()) {
      return res.status(400).json({
        message: "Product name is required",
      });
    }

    if (!brand?.trim()) {
      return res.status(400).json({
        message: "Brand is required",
      });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        message: "Price is required",
      });
    }

    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        message: "Invalid price",
      });
    }

    /* -------------------------------------------------------
       DISCOUNT PRICE
    ------------------------------------------------------- */

    let parsedDiscountPrice = null;

    if (
      discountPrice !== undefined &&
      discountPrice !== null &&
      discountPrice !== ""
    ) {
      parsedDiscountPrice = Number(discountPrice);

      if (Number.isNaN(parsedDiscountPrice) || parsedDiscountPrice < 0) {
        return res.status(400).json({
          message: "Invalid discount price",
        });
      }

      if (parsedDiscountPrice > parsedPrice) {
        return res.status(400).json({
          message: "Discount price cannot be greater than price",
        });
      }
    }

    /* -------------------------------------------------------
       PRODUCT AVAILABILITY
    ------------------------------------------------------- */

    let parsedIsAvailable = true;

    if (
      isAvailable !== undefined &&
      isAvailable !== null &&
      isAvailable !== ""
    ) {
      if (typeof isAvailable === "boolean") {
        parsedIsAvailable = isAvailable;
      } else {
        parsedIsAvailable = String(isAvailable).toLowerCase() === "true";
      }
    }

    /* -------------------------------------------------------
       COLORS
    ------------------------------------------------------- */

    let parsedColors = [];

    if (colors) {
      try {
        parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors;
      } catch (error) {
        return res.status(400).json({
          message: "Invalid colors format",
        });
      }

      if (!Array.isArray(parsedColors)) {
        return res.status(400).json({
          message: "Colors must be an array",
        });
      }

      try {
        parsedColors = parsedColors.map((color) => {
          if (!color?.name?.trim()) {
            throw new Error("Color name is required");
          }

          let colorPrice = null;

          if (
            color.price !== undefined &&
            color.price !== null &&
            color.price !== ""
          ) {
            colorPrice = Number(color.price);

            if (Number.isNaN(colorPrice) || colorPrice < 0) {
              throw new Error(`Invalid price for color: ${color.name}`);
            }
          }

          return {
            name: color.name.trim(),

            isAvailable:
              color.isAvailable === undefined
                ? true
                : typeof color.isAvailable === "boolean"
                  ? color.isAvailable
                  : String(color.isAvailable).toLowerCase() === "true",

            price: colorPrice,
          };
        });
      } catch (error) {
        return res.status(400).json({
          message: error.message,
        });
      }
    }

    /* -------------------------------------------------------
       CAMERA
    ------------------------------------------------------- */

    let parsedCamera = {
      front: "",
      rear: "",
    };

    if (camera) {
      try {
        parsedCamera = typeof camera === "string" ? JSON.parse(camera) : camera;
      } catch (error) {
        return res.status(400).json({
          message: "Invalid camera format",
        });
      }

      if (
        typeof parsedCamera !== "object" ||
        Array.isArray(parsedCamera) ||
        parsedCamera === null
      ) {
        return res.status(400).json({
          message: "Camera must be an object",
        });
      }

      parsedCamera = {
        front: parsedCamera.front?.trim() || "",
        rear: parsedCamera.rear?.trim() || "",
      };
    }

    /* -------------------------------------------------------
       MAIN IMAGE
    ------------------------------------------------------- */

    if (!req.files?.mainImage?.[0]) {
      return res.status(400).json({
        message: "Main image is required",
      });
    }

    /* -------------------------------------------------------
       UPLOAD MAIN IMAGE
    ------------------------------------------------------- */

    const mainImage = await uploadSingleImage(
      req.files.mainImage[0],
      "mobile-products/main",
    );

    if (mainImage) {
      uploadedImages.push(mainImage);
    }

    /* -------------------------------------------------------
       UPLOAD DESCRIPTION IMAGES
    ------------------------------------------------------- */

    const descriptionFiles = req.files?.descriptionImages || [];

    if (descriptionFiles.length > 8) {
      await rollbackUploads(uploadedImages);

      return res.status(400).json({
        message: "Maximum 8 description images are allowed",
      });
    }

    const descriptionImages = await uploadMultipleImages(
      descriptionFiles,
      "mobile-products/description",
    );

    uploadedImages.push(...descriptionImages);

    /* -------------------------------------------------------
       CREATE PRODUCT
    ------------------------------------------------------- */

    const product = await MobileProduct.create({
      sellerId: req.seller._id,

      productName: productName.trim(),

      slug: generateSlug(productName),

      brand: brand.trim(),

      description: description || "",

      variantGroupId: variantGroupId || null,

      variantName: variantName || "",

      ram: ram || "",

      storage: storage || "",

      colors: parsedColors,

      processor: processor || "",

      display: display || "",

      camera: parsedCamera,

      battery: battery || "",

      operatingSystem: operatingSystem || "",

      // WARRANTY
      warranty: warranty?.trim() || "",

      charging: charging || "",

      mainImage,

      descriptionImages,

      price: parsedPrice,

      discountPrice: parsedDiscountPrice,

      isAvailable: parsedIsAvailable,
    });

    return res.status(201).json({
      message: "Mobile product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create mobile product error:", error);

    await rollbackUploads(uploadedImages);

    return res.status(500).json({
      message: error.message || "Failed to create mobile product",
    });
  }
};

/* ==========================================================
   GET SELLER MOBILE PRODUCTS
========================================================== */

export const getSellerMobileProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      brand,
      ram,
      storage,
      isAvailable,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);

    const filter = {
      sellerId: req.seller._id,
      isDeleted: false,
    };

    /* -------------------------------------------------------
       SEARCH
    ------------------------------------------------------- */

    if (search.trim()) {
      filter.$or = [
        {
          productName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          brand: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          variantName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    /* -------------------------------------------------------
       FILTERS
    ------------------------------------------------------- */

    if (brand) {
      filter.brand = {
        $regex: brand,
        $options: "i",
      };
    }

    if (ram) {
      filter.ram = ram;
    }

    if (storage) {
      filter.storage = storage;
    }

    if (isAvailable !== undefined && isAvailable !== "") {
      filter.isAvailable = String(isAvailable).toLowerCase() === "true";
    }

    /* -------------------------------------------------------
       PAGINATION
    ------------------------------------------------------- */

    const skip = (pageNumber - 1) * limitNumber;

    const [products, totalProducts] = await Promise.all([
      MobileProduct.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      MobileProduct.countDocuments(filter),
    ]);

    return res.status(200).json({
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProducts / limitNumber),
        totalProducts,
        limit: limitNumber,
      },
      products,
    });
  } catch (error) {
    console.error("Get seller mobile products error:", error);

    return res.status(500).json({
      message: "Failed to fetch mobile products",
    });
  }
};

/* ==========================================================
   GET SINGLE SELLER MOBILE PRODUCT
========================================================== */

export const getSellerMobileProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await MobileProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        message: "Mobile product not found",
      });
    }

    return res.status(200).json({
      product,
    });
  } catch (error) {
    console.error("Get seller mobile product error:", error);

    return res.status(500).json({
      message: "Failed to fetch mobile product",
    });
  }
};

/* ==========================================================
   UPDATE MOBILE PRODUCT
========================================================== */

export const updateMobileProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const { id } = req.params;

    const product = await MobileProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        message: "Mobile product not found",
      });
    }

    const {
      productName,
      brand,
      description,
      variantGroupId,
      variantName,
      ram,
      storage,
      colors,
      processor,
      display,
      camera,
      battery,
      operatingSystem,
      warranty,
      charging,
      price,
      discountPrice,
      isAvailable,
      keepDescriptionImages,
    } = req.body;

    /* -------------------------------------------------------
       PRODUCT NAME
    ------------------------------------------------------- */

    if (productName !== undefined) {
      if (!productName.trim()) {
        return res.status(400).json({
          message: "Product name cannot be empty",
        });
      }

      product.productName = productName.trim();

      product.slug = generateSlug(productName);
    }

    /* -------------------------------------------------------
       BASIC FIELDS
    ------------------------------------------------------- */

    if (brand !== undefined) {
      if (!brand.trim()) {
        return res.status(400).json({
          message: "Brand cannot be empty",
        });
      }

      product.brand = brand.trim();
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (variantGroupId !== undefined) {
      product.variantGroupId = variantGroupId || null;
    }

    if (variantName !== undefined) {
      product.variantName = variantName;
    }

    if (ram !== undefined) {
      product.ram = ram;
    }

    if (storage !== undefined) {
      product.storage = storage;
    }

    if (processor !== undefined) {
      product.processor = processor;
    }

    if (display !== undefined) {
      product.display = display;
    }

    /* -------------------------------------------------------
       CAMERA
    ------------------------------------------------------- */

    if (camera !== undefined) {
      let parsedCamera;

      try {
        parsedCamera = typeof camera === "string" ? JSON.parse(camera) : camera;
      } catch (error) {
        return res.status(400).json({
          message: "Invalid camera format",
        });
      }

      if (
        typeof parsedCamera !== "object" ||
        Array.isArray(parsedCamera) ||
        parsedCamera === null
      ) {
        return res.status(400).json({
          message: "Camera must be an object",
        });
      }

      product.camera = {
        front: parsedCamera.front?.trim() || "",
        rear: parsedCamera.rear?.trim() || "",
      };
    }

    if (battery !== undefined) {
      product.battery = battery;
    }

    if (operatingSystem !== undefined) {
      product.operatingSystem = operatingSystem;
    }

    /* -------------------------------------------------------
       WARRANTY
    ------------------------------------------------------- */

    if (warranty !== undefined) {
      product.warranty = warranty?.trim() || "";
    }

    if (charging !== undefined) {
      product.charging = charging;
    }

    /* -------------------------------------------------------
       PRODUCT AVAILABILITY
    ------------------------------------------------------- */

    if (
      isAvailable !== undefined &&
      isAvailable !== null &&
      isAvailable !== ""
    ) {
      if (typeof isAvailable === "boolean") {
        product.isAvailable = isAvailable;
      } else {
        product.isAvailable = String(isAvailable).toLowerCase() === "true";
      }
    }

    /* -------------------------------------------------------
       PRICE
    ------------------------------------------------------- */

    let finalPrice = product.price;

    if (price !== undefined && price !== null && price !== "") {
      const parsedPrice = Number(price);

      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          message: "Invalid price",
        });
      }

      finalPrice = parsedPrice;
      product.price = parsedPrice;
    }

    /* -------------------------------------------------------
       DISCOUNT PRICE
    ------------------------------------------------------- */

    if (discountPrice !== undefined) {
      if (discountPrice === null || discountPrice === "") {
        product.discountPrice = null;
      } else {
        const parsedDiscountPrice = Number(discountPrice);

        if (Number.isNaN(parsedDiscountPrice) || parsedDiscountPrice < 0) {
          return res.status(400).json({
            message: "Invalid discount price",
          });
        }

        if (parsedDiscountPrice > finalPrice) {
          return res.status(400).json({
            message: "Discount price cannot be greater than price",
          });
        }

        product.discountPrice = parsedDiscountPrice;
      }
    } else if (
      product.discountPrice !== null &&
      product.discountPrice > finalPrice
    ) {
      return res.status(400).json({
        message: "Existing discount price cannot be greater than price",
      });
    }

    /* -------------------------------------------------------
       COLORS
    ------------------------------------------------------- */

    if (colors !== undefined) {
      let parsedColors;

      try {
        parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors;
      } catch (error) {
        return res.status(400).json({
          message: "Invalid colors format",
        });
      }

      if (!Array.isArray(parsedColors)) {
        return res.status(400).json({
          message: "Colors must be an array",
        });
      }

      try {
        parsedColors = parsedColors.map((color) => {
          if (!color?.name?.trim()) {
            throw new Error("Color name is required");
          }

          let colorPrice = null;

          if (
            color.price !== undefined &&
            color.price !== null &&
            color.price !== ""
          ) {
            colorPrice = Number(color.price);

            if (Number.isNaN(colorPrice) || colorPrice < 0) {
              throw new Error(`Invalid price for color: ${color.name}`);
            }
          }

          return {
            name: color.name.trim(),

            isAvailable:
              color.isAvailable === undefined
                ? true
                : typeof color.isAvailable === "boolean"
                  ? color.isAvailable
                  : String(color.isAvailable).toLowerCase() === "true",

            price: colorPrice,
          };
        });
      } catch (error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      product.colors = parsedColors;
    }

    /* -------------------------------------------------------
       MAIN IMAGE
    ------------------------------------------------------- */

    const newMainImage = req.files?.mainImage?.[0];

    if (newMainImage) {
      const updatedMainImage = await replaceImage(
        product.mainImage,
        newMainImage,
        "mobile-products/main",
      );

      product.mainImage = updatedMainImage;

      uploadedImages.push(updatedMainImage);
    }

    /* -------------------------------------------------------
       DESCRIPTION IMAGES
    ------------------------------------------------------- */

    let keepImages = [];

    if (keepDescriptionImages !== undefined) {
      try {
        keepImages =
          typeof keepDescriptionImages === "string"
            ? JSON.parse(keepDescriptionImages)
            : keepDescriptionImages;
      } catch (error) {
        return res.status(400).json({
          message: "Invalid keepDescriptionImages format",
        });
      }
    } else {
      keepImages = product.descriptionImages.map((image) => image.key);
    }

    if (!Array.isArray(keepImages)) {
      return res.status(400).json({
        message: "keepDescriptionImages must be an array",
      });
    }

    const oldDescriptionImages = product.descriptionImages || [];

    const imagesToDelete = oldDescriptionImages.filter(
      (image) => !keepImages.includes(image.key),
    );

    await deleteMultipleImages(imagesToDelete);

    const keptDescriptionImages = oldDescriptionImages.filter((image) =>
      keepImages.includes(image.key),
    );

    const newDescriptionFiles = req.files?.descriptionImages || [];

    const totalDescriptionImages =
      keptDescriptionImages.length + newDescriptionFiles.length;

    if (totalDescriptionImages > 8) {
      return res.status(400).json({
        message: "Maximum 8 description images are allowed",
      });
    }

    const newDescriptionImages = await uploadMultipleImages(
      newDescriptionFiles,
      "mobile-products/description",
    );

    uploadedImages.push(...newDescriptionImages);

    product.descriptionImages = [
      ...keptDescriptionImages,
      ...newDescriptionImages,
    ];

    /* -------------------------------------------------------
       SAVE
    ------------------------------------------------------- */

    await product.save();

    return res.status(200).json({
      message: "Mobile product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update mobile product error:", error);

    await rollbackUploads(uploadedImages);

    return res.status(500).json({
      message: error.message || "Failed to update mobile product",
    });
  }
};

/* ==========================================================
   DELETE MOBILE PRODUCT
========================================================== */

export const deleteMobileProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await MobileProduct.findOne({
      _id: id,
      sellerId: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        message: "Mobile product not found",
      });
    }

    /* -------------------------------------------------------
       DELETE S3 IMAGES
    ------------------------------------------------------- */

    await deleteSingleImage(product.mainImage);

    await deleteMultipleImages(product.descriptionImages);

    /* -------------------------------------------------------
       SOFT DELETE
    ------------------------------------------------------- */

    product.isDeleted = true;
    product.deletedAt = new Date();

    await product.save();

    return res.status(200).json({
      message: "Mobile product deleted successfully",
    });
  } catch (error) {
    console.error("Delete mobile product error:", error);

    return res.status(500).json({
      message: "Failed to delete mobile product",
    });
  }
};
