const mongoose = require("mongoose");

const salarySlipSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    attendanceDays: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    shortTimeHours: {
      type: Number,
      default: 0,
    },
    overtimeAmount: {
      type: Number,
      default: 0,
    },
    shortTimeDeduction: {
      type: Number,
      default: 0,
    },
    leaveDeduction: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      default: 0,
    },
    generatedOn: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

salarySlipSchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("SalarySlip", salarySlipSchema);
