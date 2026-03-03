const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    enum: ["employee", "manager", "admin"],
    default: "employee",
  },
  department: {
    type: String,
    required: true,
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
  return ["manager", "admin"].includes(this.role);
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
