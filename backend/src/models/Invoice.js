const mongoose = require("mongoose");

// Track stock deductions for restoration on cancel
const stockDeductionSchema = new mongoose.Schema({
  grnItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
    required: true,
  },
  qtyDeducted: {
    type: Number,
    required: true,
    min: 0,
  },
  weightDeducted: {
    type: Number,
    required: true,
    min: 0,
  },
  priceApplied: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const invoiceItemSchema = new mongoose.Schema({
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
    required: true,
    min: [0, "Quantity must be positive"],
  },
  weight: {
    type: Number,
    required: true,
    min: [0, "Weight must be positive"],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, "Unit price must be positive"],
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  // For stock restoration on cancel
  deductions: [stockDeductionSchema],
}, { _id: true });

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null, // null for walk-in customers
    },
    customerName: {
      type: String,
      required: true,
      default: "Walk-in Customer",
    },
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: function(items) {
          return items && items.length > 0;
        },
        message: "At least one item is required"
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash",
    },
    createdBy: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries (invoiceNumber index created automatically by unique: true)
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
