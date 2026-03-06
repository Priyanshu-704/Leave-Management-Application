const mongoose = require("mongoose");

const trainingCalendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      default: "",
      trim: true,
    },
    trainer: {
      type: String,
      default: "",
      trim: true,
    },
    maxParticipants: {
      type: Number,
      min: 1,
      default: 20,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
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

trainingCalendarEventSchema.index({ department: 1, startDate: 1 });

module.exports = mongoose.model("TrainingCalendarEvent", trainingCalendarEventSchema);
