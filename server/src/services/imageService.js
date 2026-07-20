/* global URL */
const imagekit = require('../config/imagekit');

/**
 * Extracts the file path from an ImageKit URL.
 * Given "https://xxx.imagekit.io/abc/def/shirt.jpg?tr=w-300", returns "def/shirt.jpg"
 * @param {string} url
 * @returns {string|null} file path or null if parsing fails
 */
const extractFilePath = (url) => {
  try {
    const urlObj = new URL(url);
    // path starts with '/', strip it
    return urlObj.pathname.replace(/^\/+/, '') || null;
  } catch {
    return null;
  }
};

/**
 * Deletes a single image from ImageKit by its URL.
 * @param {string} fileUrl - The full ImageKit URL
 * @returns {Promise<void>}
 */
const deleteImage = async (fileUrl) => {
  const filePath = extractFilePath(fileUrl);
  if (!filePath) return;

  try {
    await imagekit.deleteFile(filePath);
  } catch (error) {
    // Log but don't throw — image may already be deleted or URL may be invalid
    console.error(`Failed to delete ImageKit file ${filePath}:`, error.message || error);
  }
};

/**
 * Deletes multiple images from ImageKit.
 * @param {string[]} fileUrls - Array of full ImageKit URLs
 * @returns {Promise<void>}
 */
const deleteImages = async (fileUrls) => {
  if (!fileUrls || fileUrls.length === 0) return;

  const filePaths = fileUrls.map(extractFilePath).filter(Boolean);
  if (filePaths.length === 0) return;

  try {
    await imagekit.bulkDeleteFiles(filePaths);
  } catch (error) {
    console.error(`Failed to bulk-delete ImageKit files:`, error.message || error);
  }
};

module.exports = {
  getUploadSignature: async () => {
    throw new Error('Not implemented — see wardrobe upload ticket');
  },
  deleteImage,
  deleteImages,
};
