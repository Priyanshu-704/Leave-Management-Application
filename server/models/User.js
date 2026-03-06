const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  profilePicture: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["employee", "manager", "admin", "super_admin"],
    default: "employee",
  },
  designation: {
    type: String,
    enum: [
      "intern",
      "staff",
      "senior",
      "lead",
      "manager",
      "project_manager",
      "hr",
      "finance",
      "it",
      "director",
    ],
    default: "staff",
  },
  department: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  joiningDate: {
    type: Date,
    default: null,
  },
  employeeId: {
    type: String,
    unique: true,
    required: true,
  },
  leaveBalance: {
    annual: { type: Number, default: 20 },
    sick: { type: Number, default: 10 },
    personal: { type: Number, default: 5 },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
  },
  forcePasswordChange: {
    type: Boolean,
    default: false,
  },
  activeSessionId: {
    type: String,
    default: null,
  },
  refreshTokenHash: {
    type: String,
    default: null,
  },
  refreshTokenExpiresAt: {
    type: Date,
    default: null,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorCodeHash: {
    type: String,
    default: null,
  },
  twoFactorCodeExpiresAt: {
    type: Date,
    default: null,
  },
  twoFactorPendingSessionId: {
    type: String,
    default: null,
  },
  twoFactorPendingDeviceFingerprint: {
    type: String,
    default: null,
  },
  knownDevices: [
    {
      fingerprint: { type: String, required: true },
      deviceName: { type: String, default: "Unknown Device" },
      ipAddress: { type: String, default: "" },
      lastLoginAt: { type: Date, default: Date.now },
    },
  ],
  // Per-user feature access override (featureKey => true/false)
  featurePermissions: {
    type: Map,
    of: Boolean,
    default: {},
  },
  // Department scope controls. If allowCrossDepartment is true, user can access all departments.
  allowCrossDepartment: {
    type: Boolean,
    default: false,
  },
  allowedDepartments: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

userSchema.methods.getLeaveSummary = async function () {
  const leaves = await Leave.find({
    employee: this._id,
    status: "approved",
  });

  const summary = {
    annual: { taken: 0, remaining: this.leaveBalance.annual },
    sick: { taken: 0, remaining: this.leaveBalance.sick },
    personal: { taken: 0, remaining: this.leaveBalance.personal },
  };

  leaves.forEach((leave) => {
    if (leave.leaveType !== "unpaid") {
      summary[leave.leaveType].taken += leave.days;
      summary[leave.leaveType].remaining -= leave.days;
    }
  });

  return summary;
};

// Static method to get department heads
userSchema.statics.getDepartmentHeads = async function () {
  return this.find({
    role: "manager",
    isActive: true,
  }).select("name email department");
};

// Method to check if user can approve leaves
userSchema.methods.canApproveLeaves = function () {
  return ["manager", "admin", "super_admin"].includes(this.role);
};

// Method to get direct reports (if manager)
userSchema.methods.getDirectReports = async function () {
  if (this.role !== "manager") return [];

  return this.constructor
    .find({
      department: this.department,
      role: "employee",
      isActive: true,
    })
    .select("name email employeeId");
};

module.exports = mongoose.model("User", userSchema);
