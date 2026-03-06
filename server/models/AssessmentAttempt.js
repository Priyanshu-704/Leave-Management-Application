const mongoose = require("mongoose");

const assessmentAttemptSchema = new mongoose.Schema(
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
    answers: {
      type: [Number],
      default: [],
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

assessmentAttemptSchema.index({ course: 1, employee: 1, createdAt: -1 });

module.exports = mongoose.model("AssessmentAttempt", assessmentAttemptSchema);
