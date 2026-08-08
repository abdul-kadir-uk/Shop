import { uploadToS3, deleteFromS3 } from "./s3.js";

/**
 * Upload a single image
 */
export const uploadSingleImage = async (file, folder) => {
  if (!file) return null;

  return await uploadToS3(file, folder);
};

/**
 * Upload multiple images in parallel
 */
export const uploadMultipleImages = async (files = [], folder) => {
  if (!files.length) return [];

  return await Promise.all(files.map((file) => uploadToS3(file, folder)));
};

/**
 * Delete a single image
 */
export const deleteSingleImage = async (image) => {
  if (!image?.key) return;

  await deleteFromS3(image.key);
};

/**
 * Delete multiple images
 */
export const deleteMultipleImages = async (images = []) => {
  if (!images.length) return;

  await Promise.all(
    images.map(async (image) => {
      if (image?.key) {
        await deleteFromS3(image.key);
      }
    }),
  );
};

/**
 * Rollback uploaded images
 * Used when database save fails
 */
export const rollbackUploads = async (uploadedImages = []) => {
  if (!uploadedImages.length) return;

  await Promise.all(
    uploadedImages.map(async (image) => {
      try {
        if (image?.key) {
          await deleteFromS3(image.key);
        }
      } catch (error) {
        console.error("Rollback failed:", error.message);
      }
    }),
  );
};

/**
 * Replace a single image
 * Upload new image then delete old image
 */
export const replaceImage = async (oldImage, newFile, folder) => {
  if (!newFile) return oldImage;

  const uploaded = await uploadToS3(newFile, folder);

  if (oldImage?.key) {
    try {
      await deleteFromS3(oldImage.key);
    } catch (error) {
      console.error("Old image delete failed:", error.message);
    }
  }

  return uploaded;
};

/**
 * Replace multiple images
 */
export const replaceMultipleImages = async (
  oldImages = [],
  newFiles = [],
  folder,
) => {
  const uploaded = await uploadMultipleImages(newFiles, folder);

  await deleteMultipleImages(oldImages);

  return uploaded;
};
