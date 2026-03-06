const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "general",
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    value: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["available", "allocated", "maintenance", "retired"],
      default: "available",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Asset", assetSchema);
