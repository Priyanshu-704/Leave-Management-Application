const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    jobPosting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    round: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: "Interview",
      trim: true,
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      min: 15,
      default: 60,
    },
    mode: {
      type: String,
      enum: ["online", "offline", "phone"],
      default: "online",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
    },
    feedback: {
      type: String,
      default: "",
      trim: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

interviewSchema.index({ department: 1, scheduledAt: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
