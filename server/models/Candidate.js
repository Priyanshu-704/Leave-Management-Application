const mongoose = require("mongoose");

const onboardingItemSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: false },
);

const candidateSchema = new mongoose.Schema(
  {
    jobPosting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    currentCompany: {
      type: String,
      default: "",
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    resumeUrl: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      default: "direct",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    stage: {
      type: String,
      enum: [
        "applied",
        "screening",
        "interview",
        "offered",
        "onboarding",
        "hired",
        "rejected",
      ],
      default: "applied",
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateAccount",
      default: null,
    },
    assignedRecruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    documentVerification: {
      status: {
        type: String,
        enum: ["pending", "in_progress", "verified", "rejected"],
        default: "pending",
      },
      remarks: {
        type: String,
        default: "",
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    backgroundCheck: {
      status: {
        type: String,
        enum: ["pending", "in_progress", "clear", "failed"],
        default: "pending",
      },
      vendor: {
        type: String,
        default: "",
      },
      remarks: {
        type: String,
        default: "",
      },
      completedAt: {
        type: Date,
        default: null,
      },
    },
    offer: {
      status: {
        type: String,
        enum: ["not_generated", "generated", "sent", "accepted", "declined"],
        default: "not_generated",
      },
      ctc: {
        type: Number,
        default: 0,
      },
      joiningDate: {
        type: Date,
        default: null,
      },
      letterText: {
        type: String,
        default: "",
      },
      letterSentAt: {
        type: Date,
        default: null,
      },
    },
    onboardingChecklist: {
      type: [onboardingItemSchema],
      default: [
        { item: "HR Documentation" },
        { item: "IT Account Setup" },
        { item: "Policy Orientation" },
        { item: "Manager Introduction" },
      ],
    },
    probation: {
      status: {
        type: String,
        enum: ["not_started", "in_progress", "extended", "completed"],
        default: "not_started",
      },
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      reviewDate: {
        type: Date,
        default: null,
      },
      remarks: {
        type: String,
        default: "",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

candidateSchema.index({ department: 1, stage: 1 });
candidateSchema.index({ email: 1, jobPosting: 1 }, { unique: true });
candidateSchema.index({ account: 1, jobPosting: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Candidate", candidateSchema);
