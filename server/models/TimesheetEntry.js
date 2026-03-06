const mongoose = require("mongoose");

const timesheetEntrySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTask",
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    notes: {
      type: String,
      default: "",
    },
    billingStatus: {
      type: String,
      enum: ["billable", "non-billable"],
      default: "billable",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TimesheetEntry", timesheetEntrySchema);
