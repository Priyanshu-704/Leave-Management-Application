const mongoose = require("mongoose");

const workforcePolicySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      default: "default",
    },
    attendance: {
      checkInEnabled: {
        type: Boolean,
        default: true,
      },
      officeGeoFence: {
        latitude: {
          type: Number,
          default: null,
        },
        longitude: {
          type: Number,
          default: null,
        },
        radiusMeters: {
          type: Number,
          default: 200,
        },
      },
    },
    holidayWeekend: {
      weekendDays: {
        type: [Number],
        default: [0, 6],
      },
    },
    leave: {
      autoApproveEnabled: {
        type: Boolean,
        default: true,
      },
      maxAutoApproveDays: {
        type: Number,
        default: 2,
      },
      autoApproveTypes: {
        type: [String],
        default: ["sick", "personal"],
      },
    },
    payroll: {
      monthlyWorkingHours: {
        type: Number,
        default: 176,
      },
      overtimeRateMultiplier: {
        type: Number,
        default: 1.5,
      },
      shortTimePenaltyMultiplier: {
        type: Number,
        default: 1,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WorkforcePolicy", workforcePolicySchema);
