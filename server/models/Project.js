const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    code: {
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
    clientName: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    budget: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["planned", "active", "on-hold", "completed"],
      default: "planned",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Project", projectSchema);
