const mongoose = require("mongoose");

const projectAllocationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleOnProject: {
      type: String,
      default: "contributor",
    },
    allocationPercent: {
      type: Number,
      default: 100,
      min: 1,
      max: 100,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "released"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ProjectAllocation", projectAllocationSchema);
