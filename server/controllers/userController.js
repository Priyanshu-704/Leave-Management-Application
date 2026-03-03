const User = require("../models/User");
const Leave = require("../models/Leave");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const {
      role,
      department,
      isActive,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === "true";

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort("-createdAt");

    const total = await User.countDocuments(query);

    res.json({
      users,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    // If no ID provided, get current user
    const userId = req.params.id || req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's leave statistics
    const leaveStats = await Leave.aggregate([
      { $match: { employee: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalDays: { $sum: "$days" },
        },
      },
    ]);

    const recentLeaves = await Leave.find({ employee: user._id })
      .sort("-appliedOn")
      .limit(5);

    res.json({
      ...user.toObject(),
      leaveStatistics: leaveStats,
      recentLeaves,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      role,
      department,
      employeeId,
      leaveBalance,
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email or employee ID",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "employee",
      department,
      employeeId,
      leaveBalance: leaveBalance || {
        annual: 20,
        sick: 10,
        personal: 5,
      },
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      leaveBalance: user.leaveBalance,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and already exists
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Check if employeeId is being changed and already exists
    if (req.body.employeeId && req.body.employeeId !== user.employeeId) {
      const employeeIdExists = await User.findOne({
        employeeId: req.body.employeeId,
      });
      if (employeeIdExists) {
        return res.status(400).json({ message: "Employee ID already in use" });
      }
    }

    // Update fields
    const updatableFields = [
      "name",
      "email",
      "department",
      "role",
      "employeeId",
    ];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update leave balance if provided
    if (req.body.leaveBalance) {
      user.leaveBalance = {
        ...user.leaveBalance,
        ...req.body.leaveBalance,
      };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      employeeId: updatedUser.employeeId,
      leaveBalance: updatedUser.leaveBalance,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has any pending leaves
    const pendingLeaves = await Leave.findOne({
      employee: user._id,
      status: "pending",
    });

    if (pendingLeaves) {
      return res.status(400).json({
        message: "Cannot delete user with pending leave requests",
      });
    }

    // Soft delete - just deactivate
    user.isActive = false;
    await user.save();

    // Alternatively, for hard delete:
    // await User.findByIdAndDelete(req.params.id);
    // await Leave.deleteMany({ employee: user._id });

    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["employee", "manager", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent removing the last admin
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot remove the last admin user",
        });
      }
    }

    user.role = role;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      message: "User role updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user leave balance
// @route   PUT /api/users/:id/leave-balance
// @access  Private/Admin
exports.updateLeaveBalance = async (req, res) => {
  try {
    const { annual, sick, personal } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update leave balances
    if (annual !== undefined) user.leaveBalance.annual = annual;
    if (sick !== undefined) user.leaveBalance.sick = sick;
    if (personal !== undefined) user.leaveBalance.personal = personal;

    await user.save();

    res.json({
      message: "Leave balance updated successfully",
      leaveBalance: user.leaveBalance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users' leave balances
// @route   GET /api/users/leave-balances
// @access  Private/Manager/Admin
exports.getUserLeaveBalances = async (req, res) => {
  try {
    const { department } = req.query;

    let query = { isActive: true };
    if (department) query.department = department;

    const users = await User.find(query)
      .select("name email employeeId department leaveBalance role")
      .sort("department name");

    // Get used leave counts for each user
    const usersWithUsedLeaves = await Promise.all(
      users.map(async (user) => {
        const usedLeaves = await Leave.aggregate([
          {
            $match: {
              employee: user._id,
              status: "approved",
              leaveType: { $ne: "unpaid" },
            },
          },
          {
            $group: {
              _id: "$leaveType",
              totalDays: { $sum: "$days" },
            },
          },
        ]);

        const used = {
          annual: 0,
          sick: 0,
          personal: 0,
        };

        usedLeaves.forEach((item) => {
          used[item._id] = item.totalDays;
        });

        return {
          ...user.toObject(),
          usedLeaves: used,
          remainingLeaves: {
            annual: user.leaveBalance.annual - used.annual,
            sick: user.leaveBalance.sick - used.sick,
            personal: user.leaveBalance.personal - used.personal,
          },
        };
      }),
    );

    res.json(usersWithUsedLeaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk update leave balances
// @route   POST /api/users/bulk-update-leave-balances
// @access  Private/Admin
exports.bulkUpdateLeaveBalances = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { userId, annual, sick, personal }

    const operations = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.userId },
        update: {
          $set: {
            "leaveBalance.annual": update.annual,
            "leaveBalance.sick": update.sick,
            "leaveBalance.personal": update.personal,
          },
        },
      },
    }));

    const result = await User.bulkWrite(operations);

    res.json({
      message: "Bulk update completed",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users by department
// @route   GET /api/users/department/:department
// @access  Private/Manager/Admin
exports.getDepartmentUsers = async (req, res) => {
  try {
    const users = await User.find({
      department: req.params.department,
      isActive: true,
    })
      .select("name email employeeId role leaveBalance")
      .sort("name");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deactivating the last admin
    if (user.role === "admin" && user.isActive) {
      const adminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot deactivate the last active admin",
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (self)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    const { name, email } = req.body;

    if (name) user.name = name;

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/statistics
// @access  Private/Manager/Admin
exports.getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const departmentStats = await User.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ]);

    const leaveStats = await Leave.aggregate([
      {
        $group: {
          _id: {
            status: "$status",
            month: { $month: "$appliedOn" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get users with most leaves taken
    const topLeaveTakers = await Leave.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$employee",
          totalLeaves: { $sum: "$days" },
          leaveCount: { $sum: 1 },
        },
      },
      { $sort: { totalLeaves: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          "user.name": 1,
          "user.email": 1,
          "user.department": 1,
          totalLeaves: 1,
          leaveCount: 1,
        },
      },
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
      byRole: roleStats,
      byDepartment: departmentStats,
      leaveTrends: leaveStats,
      topLeaveTakers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users by department for department head selection
// @route   GET /api/users/department/:departmentName/candidates
// @access  Private/Admin
exports.getDepartmentHeadCandidates = async (req, res) => {
  try {
    const { departmentName } = req.params;
    const { excludeUserId } = req.query;

    // Decode the department name
    const decodedDeptName = decodeURIComponent(departmentName);

    console.log("Fetching head candidates for department:", decodedDeptName);

    // Build query
    let query = {
      department: decodedDeptName,
      isActive: true,
      role: { $in: ["employee", "manager", "admin"] }, // Only employees and managers can be heads
    };

    // Exclude current head if specified
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    // Find users
    const users = await User.find(query)
      .select("name email employeeId role department")
      .sort("name");

    console.log(`Found ${users.length} candidates`);

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching department head candidates:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if exists (optional)
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, "..", user.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Save profile picture path to user
    const pictureUrl = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = pictureUrl;
    await user.save();

    res.json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: { profilePicture: pictureUrl },
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: error.message });
  }
};
