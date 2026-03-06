const mongoose = require("mongoose");

const projectBillingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    billedHours: {
      type: Number,
      default: 0,
    },
    ratePerHour: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0,
    },
    invoiceNumber: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "raised", "paid"],
      default: "draft",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ProjectBilling", projectBillingSchema);
