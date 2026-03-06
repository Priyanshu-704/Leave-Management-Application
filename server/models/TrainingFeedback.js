const mongoose = require("mongoose");

const trainingFeedbackSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: "",
      trim: true,
    },
    recommend: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

trainingFeedbackSchema.index({ course: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model("TrainingFeedback", trainingFeedbackSchema);
