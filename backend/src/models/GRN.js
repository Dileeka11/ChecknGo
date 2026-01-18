const mongoose = require("mongoose");

const grnItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  itemCode: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
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
  listPrice: {
    type: Number,
    required: [true, "List price is required"],
    min: [0, "List price must be positive"],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, "Discount cannot be negative"],
    max: [100, "Discount cannot exceed 100%"],
  },
  sellingPrice: {
    type: Number,
    required: [true, "Selling price is required"],
    min: [0, "Selling price must be positive"],
  },
  totalCost: {
    type: Number,
    required: true,
  }
}, { _id: true });

const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },
    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
    },
    items: {
      type: [grnItemSchema],
      required: true,
      validate: {
        validator: function(items) {
          return items && items.length > 0;
        },
        message: "At least one item is required"
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount must be positive"],
    },
    receivedDate: {
      type: Date,
      required: [true, "Received date is required"],
      default: Date.now,
    },
    createdBy: {
      type: String,
      required: [true, "Creator is required"],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["pending", "received", "cancelled"],
        message: "Status must be pending, received, or cancelled"
      },
      default: "received",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
grnSchema.index({ supplierId: 1 });
grnSchema.index({ receivedDate: -1 });
grnSchema.index({ status: 1 });

module.exports = mongoose.model("GRN", grnSchema);
