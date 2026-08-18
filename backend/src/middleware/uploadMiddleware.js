// src/middleware/uploadMiddleware.js

import multer from "multer";
import sharp from "sharp";

// =========================
// Multer Memory Storage
// =========================

const storage = multer.memoryStorage();

// =========================
// Allowed Product Image Types
// =========================

const allowedMimeTypes = [
  "image/heic",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
];

// =========================
// Product Image File Filter
// =========================

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only JPG, JPEG, PNG, WEBP and AVIF images are allowed."),
      false,
    );
  }

  cb(null, true);
};

// =========================
// Product Image Upload
// =========================

export const uploadProductImages = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
}).fields([
  {
    name: "mainImage",
    maxCount: 1,
  },

  {
    name: "descriptionImages",
    maxCount: 4,
  },
]);

// =========================
// Product Image Compression
// =========================

export const compressProductImages = async (req, res, next) => {
  try {
    // -----------------------
    // Main Image
    // -----------------------

    if (req.files && req.files.mainImage && req.files.mainImage.length) {
      const image = req.files.mainImage[0];

      image.buffer = await sharp(image.buffer)
        .resize({
          width: 1200,
          withoutEnlargement: true,
        })
        .webp({
          quality: 82,
        })
        .toBuffer();

      image.mimetype = "image/webp";
      image.originalname =
        image.originalname.replace(/\.[^/.]+$/, "") + ".webp";
    }

    // -----------------------
    // Description Images
    // -----------------------

    if (req.files && req.files.descriptionImages) {
      for (const image of req.files.descriptionImages) {
        image.buffer = await sharp(image.buffer)
          .resize({
            width: 1200,
            withoutEnlargement: true,
          })
          .webp({
            quality: 80,
          })
          .toBuffer();

        image.mimetype = "image/webp";

        image.originalname =
          image.originalname.replace(/\.[^/.]+$/, "") + ".webp";
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// Aadhaar Document Upload
// ==========================================================

const aadhaarFileFilter = (req, file, cb) => {
  const allowedAadhaarTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];

  if (!allowedAadhaarTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only JPG, JPEG, PNG and PDF Aadhaar documents are allowed."),
      false,
    );
  }

  cb(null, true);
};

export const uploadAadhaarDocument = multer({
  storage,

  fileFilter: aadhaarFileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
}).single("aadhaarDocument");
