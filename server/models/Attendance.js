const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkIn: {
      time: {
        type: Date,
        required: true,
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
          validate: {
            validator: function (v) {
              return !v || (Array.isArray(v) && v.length === 2);
            },
            message: "Coordinates must be an array of [longitude, latitude]",
          },
        },
        address: String,
      },
      ip: String,
      device: String,
      note: String,
      photo: String,
    },
    checkOut: {
      time: Date,
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
          validate: {
            validator: function (v) {
              return !v || (Array.isArray(v) && v.length === 2);
            },
            message: "Coordinates must be an array of [longitude, latitude]",
          },
        },
        address: String,
      },
      ip: String,
      device: String,
      note: String,
      photo: String,
    },
    status: {
      type: String,
      enum: [
        "present",
        "absent",
        "late",
        "half-day",
        "on-leave",
        "holiday",
        "weekend",
      ],
      default: "present",
    },
    workHours: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    earlyDeparture: {
      type: Boolean,
      default: false,
    },
    earlyDepartureMinutes: {
      type: Number,
      default: 0,
    },
    breaks: [
      {
        startTime: Date,
        endTime: Date,
        duration: Number,
        type: {
          type: String,
          enum: ["lunch", "tea", "other"],
          default: "other",
        },
      },
    ],
    notes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
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

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Create geospatial indexes with sparse option to only index documents with location data
attendanceSchema.index({ "checkIn.location": "2dsphere" }, { sparse: true });
attendanceSchema.index({ "checkOut.location": "2dsphere" }, { sparse: true });

// Virtual for calculating duration
attendanceSchema.virtual("duration").get(function () {
  if (this.checkIn?.time && this.checkOut?.time) {
    return (this.checkOut.time - this.checkIn.time) / (1000 * 60 * 60);
  }
  return 0;
});

// Method to calculate work hours
attendanceSchema.methods.calculateWorkHours = function () {
  if (this.checkIn?.time && this.checkOut?.time) {
    const diffMs = this.checkOut.time - this.checkIn.time;
    const breakTotal = this.breaks.reduce(
      (total, b) => total + (b.duration || 0),
      0,
    );
    this.workHours = diffMs / (1000 * 60 * 60) - breakTotal / 60;
    return this.workHours;
  }
  return 0;
};

// Method to check if employee is late
attendanceSchema.methods.checkLate = function (shiftStartTime = "09:00") {
  if (!this.checkIn?.time) return false;

  const checkInHour = this.checkIn.time.getHours();
  const checkInMin = this.checkIn.time.getMinutes();
  const [startHour, startMin] = shiftStartTime.split(":").map(Number);

  if (
    checkInHour > startHour ||
    (checkInHour === startHour && checkInMin > startMin)
  ) {
    this.isLate = true;
    this.lateMinutes = (checkInHour - startHour) * 60 + (checkInMin - startMin);
    this.status = "late";
  }

  return this.isLate;
};

module.exports = mongoose.model("Attendance", attendanceSchema);