const mongoose = require("mongoose");

const trainingNominationSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    nominatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["nominated", "approved", "rejected", "in_progress", "completed"],
      default: "nominated",
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    nominatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

trainingNominationSchema.index({ employee: 1, course: 1 }, { unique: true });
trainingNominationSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model("TrainingNomination", trainingNominationSchema);
