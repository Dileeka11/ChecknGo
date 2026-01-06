const DocumentTracker = require("../models/DocumentTracker");

/**
 * Document Tracking Utility
 * Generates sequential codes for various document types
 */
class DocumentTracking {
  /**
   * Generate the next code for a document type
   * @param {string} documentType - Type of document (e.g., "CUSTOMER", "SUPPLIER")
   * @param {string} prefix - Prefix for the code (e.g., "CUST", "SUP")
   * @param {number} padding - Number of digits to pad (default: 4)
   * @returns {Promise<string>} Generated code (e.g., "CUST0001")
   */
  static async generateCode(documentType, prefix, padding = 4) {
    try {
      // Find and update the tracker atomically
      const tracker = await DocumentTracker.findOneAndUpdate(
        { documentType: documentType.toUpperCase() },
        {
          $inc: { lastNumber: 1 },
          $setOnInsert: {
            prefix: prefix.toUpperCase(),
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      // Format the code with zero-padding
      const paddedNumber = String(tracker.lastNumber).padStart(padding, "0");
      return `${tracker.prefix}${paddedNumber}`;
    } catch (error) {
      console.error("Error generating document code:", error);
      throw new Error("Failed to generate document code");
    }
  }

  /**
   * Get the current last number for a document type
   * @param {string} documentType - Type of document
   * @returns {Promise<number>} Current last number
   */
  static async getCurrentNumber(documentType) {
    const tracker = await DocumentTracker.findOne({
      documentType: documentType.toUpperCase(),
    });
    return tracker ? tracker.lastNumber : 0;
  }

  /**
   * Reset the counter for a document type (use with caution!)
   * @param {string} documentType - Type of document
   * @param {number} startNumber - Number to reset to (default: 0)
   */
  static async resetCounter(documentType, startNumber = 0) {
    await DocumentTracker.findOneAndUpdate(
      { documentType: documentType.toUpperCase() },
      { lastNumber: startNumber },
      { upsert: true }
    );
  }
}

module.exports = DocumentTracking;
