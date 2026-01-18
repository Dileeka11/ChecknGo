const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item is required"],
    },
    itemCode: {
      type: String,
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    grnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GRN",
      required: [true, "GRN is required"],
    },
    grnNumber: {
      type: String,
      required: true,
    },
    grnItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "GRN Item ID is required"],
      unique: true, // Prevent duplicate stock entries for same GRN item
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity must be positive"],
    },
    itemWeight: {
      type: Number,
      required: [true, "Item weight is required"],
      min: [0, "Item weight must be positive"],
    },
    remainingQty: {
      type: Number,
      required: [true, "Remaining quantity is required"],
      min: [0, "Remaining quantity cannot be negative"],
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price must be positive"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price must be positive"],
    },
    receivedDate: {
      type: Date,
      required: [true, "Received date is required"],
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["available", "depleted", "reserved"],
        message: "Status must be available, depleted, or reserved",
      },
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for FIFO queries and filtering
stockSchema.index({ itemId: 1, receivedDate: 1 }); // FIFO query: oldest first
stockSchema.index({ status: 1 });
stockSchema.index({ grnId: 1 });

module.exports = mongoose.model("Stock", stockSchema);
