const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["morning", "evening", "night", "general"],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please use HH:MM format"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please use HH:MM format"],
    },
    gracePeriod: {
      type: Number,
      default: 15,
      min: 0,
    },
    latePenaltyAfter: {
      type: Number,
      default: 30,
      min: 0,
    },
    requiresNextDay: {
      type: Boolean,
      default: false,
    },
    totalHours: {
      type: Number,
      // Remove required: true since it's calculated
      default: 0,
    },
    breakDuration: {
      type: Number,
      default: 60,
      min: 0,
    },
    applicableDays: [
      {
        type: String,
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
    ],

    allowances: {
      baseRate: {
        type: Number,
        default: 1.0,
      },
      overtimeRate: {
        type: Number,
        default: 1.5,
      },
      nightDifferential: {
        type: Number,
        default: 1.1,
      },
      weekendRate: {
        type: Number,
        default: 1.5,
      },
      holidayRate: {
        type: Number,
        default: 2.0,
      },
      shiftAllowance: {
        type: Number,
        default: 0,
      },
      mealAllowance: {
        type: Number,
        default: 0,
      },
      transportAllowance: {
        type: Number,
        default: 0,
      },
    },

    department: {
      type: String,
      required: true,
    },
    assignedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    rotationEnabled: {
      type: Boolean,
      default: false,
    },
    rotationFrequency: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
      default: "weekly",
    },
    rotationGroup: {
      type: String,
      enum: ["A", "B", "C", "D"],
      default: "A",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    description: String,
    notes: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

shiftSchema.pre("save", function () {
  if (this.startTime && this.endTime) {
    const start = this.startTime.split(":").map(Number);
    const end = this.endTime.split(":").map(Number);

    let startMinutes = start[0] * 60 + start[1];
    let endMinutes = end[0] * 60 + end[1];

    if (this.requiresNextDay) {
      endMinutes += 24 * 60;
    }

    this.totalHours = (endMinutes - startMinutes) / 60;

    if (this.totalHours < 0) {
      this.totalHours = 0;
    }
  }
});

// Pre-validate middleware to ensure totalHours is set
shiftSchema.pre("validate", function () {
  if (!this.totalHours && this.startTime && this.endTime) {
    const start = this.startTime.split(":").map(Number);
    const end = this.endTime.split(":").map(Number);

    let startMinutes = start[0] * 60 + start[1];
    let endMinutes = end[0] * 60 + end[1];

    if (this.requiresNextDay) {
      endMinutes += 24 * 60;
    }

    this.totalHours = (endMinutes - startMinutes) / 60;
  }
});

module.exports = mongoose.model("Shift", shiftSchema);
