const mongoose = require("mongoose");

const resourcePlanSchema = new mongoose.Schema(
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
    month: {
      type: String,
      required: true,
    },
    plannedHours: {
      type: Number,
      default: 0,
    },
    allocatedPercent: {
      type: Number,
      default: 100,
      min: 1,
      max: 100,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ResourcePlan", resourcePlanSchema);
