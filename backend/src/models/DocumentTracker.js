const mongoose = require("mongoose");

const documentTrackerSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    prefix: {
      type: String,
      required: true,
      uppercase: true,
    },
    lastNumber: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DocumentTracker", documentTrackerSchema);
