const mongoose = require("mongoose");

const assetAllocationSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    allocatedOn: {
      type: Date,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      default: null,
    },
    returnedOn: {
      type: Date,
      default: null,
    },
    returnReason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["allocated", "returned"],
      default: "allocated",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AssetAllocation", assetAllocationSchema);
