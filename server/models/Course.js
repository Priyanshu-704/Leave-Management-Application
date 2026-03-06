const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctOption: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
    },
    mode: {
      type: String,
      enum: ["online", "classroom", "blended"],
      default: "online",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    durationHours: {
      type: Number,
      min: 1,
      default: 1,
    },
    provider: {
      type: String,
      default: "In-house",
      trim: true,
    },
    courseUrl: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    certificationOffered: {
      type: Boolean,
      default: false,
    },
    quiz: {
      enabled: {
        type: Boolean,
        default: false,
      },
      passingScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 70,
      },
      questions: {
        type: [quizQuestionSchema],
        default: [],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
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

courseSchema.index({ department: 1, category: 1 });

module.exports = mongoose.model("Course", courseSchema);
