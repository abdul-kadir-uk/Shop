// utils/s3.js

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import crypto from "crypto";
import path from "path";

const s3 = new S3Client({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate unique filename
 */
const generateFileName = (originalName) => {
  const random = crypto.randomBytes(16).toString("hex");
  const extension = path.extname(originalName);

  return `${Date.now()}-${random}${extension}`;
};

/**
 * Upload file to S3
 */
export const uploadToS3 = async (file, folder = "") => {
  const fileName = generateFileName(file.originalname);

  const key = folder ? `${folder}/${fileName}` : fileName;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    key,
    url: fileUrl,
  };
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (key) => {
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  await s3.send(command);
};

export default s3;
