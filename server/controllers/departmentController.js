const Department = require("../models/Department");
const User = require("../models/User");
const Leave = require("../models/Leave");

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, location, contactInfo, settings } =
      req.body;

    // Check if department with same name or code exists
    const existingDept = await Department.findOne({
      $or: [{ name }, { code: code?.toUpperCase() }],
    });

    if (existingDept) {
      return res.status(400).json({
        message: "Department with this name or code already exists",
      });
    }

    const department = await Department.create({
      name,
      code: code?.toUpperCase() || name.substring(0, 3).toUpperCase(),
      description,
      location,
      contactInfo,
      settings: settings || {
        defaultLeaveQuota: { annual: 20, sick: 10, personal: 5 },
      },
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      includeStats = false,
    } = req.query;

    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let departments = await Department.find(query)
      .populate("headOfDepartment", "name email employeeId")
      .populate("parentDepartment", "name code")
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort("name");

    if (includeStats === "true") {
      // Add employee counts and leave statistics
      departments = await Promise.all(
        departments.map(async (dept) => {
          const employees = await User.find({
            department: dept.name,
            isActive: true,
          }).select("_id");

          const employeeIds = employees.map((e) => e._id);

          // Get leave statistics for this department
          const leaveStats = await Leave.aggregate([
            {
              $match: {
                employee: { $in: employeeIds },
                status: "approved",
              },
            },
            {
              $group: {
                _id: "$leaveType",
                totalDays: { $sum: "$days" },
                count: { $sum: 1 },
              },
            },
          ]);

          return {
            ...dept.toObject(),
            employeeCount: employees.length,
            employeeIds,
            leaveStatistics: leaveStats,
          };
        }),
      );
    }

    const total = await Department.countDocuments(query);

    res.json({
      success: true,
      data: departments,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("headOfDepartment", "name email employeeId")
      .populate("parentDepartment", "name code")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Get employees in this department
    const employees = await User.find({
      department: department.name,
      isActive: true,
    }).select("name email employeeId role leaveBalance isActive");

    // Get leave statistics
    const employeeIds = employees.map((e) => e._id);

    const leaveStats = await Leave.aggregate([
      {
        $match: {
          employee: { $in: employeeIds },
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          totalLeaves: { $sum: "$days" },
          averageLeaves: { $avg: "$days" },
          byType: {
            $push: {
              type: "$leaveType",
              days: "$days",
            },
          },
        },
      },
    ]);

    // Get pending approvals if user is manager/admin
    let pendingApprovals = [];
    if (["manager", "admin"].includes(req.user.role)) {
      pendingApprovals = await Leave.find({
        status: "pending",
        employee: { $in: employeeIds },
      })
        .populate("employee", "name employeeId ")
        .sort("-appliedOn")
        .limit(10);
    }

    res.json({
      success: true,
      data: {
        ...department.toObject(),
        employees,
        employeeCount: employees.length,
        leaveStatistics: leaveStats[0] || {
          totalLeaves: 0,
          averageLeaves: 0,
          byType: [],
        },
        pendingApprovals,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Check for duplicate name/code if updating
    if (req.body.name || req.body.code) {
      const existingDept = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name: req.body.name }, { code: req.body.code?.toUpperCase() }],
      });

      if (existingDept) {
        return res.status(400).json({
          message: "Department with this name or code already exists",
        });
      }
    }

    // Update fields
    const updatableFields = [
      "name",
      "description",
      "location",
      "contactInfo",
      "settings",
      "budget",
      "parentDepartment",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        department[field] = req.body[field];
      }
    });

    if (req.body.code) {
      department.code = req.body.code.toUpperCase();
    }

    department.updatedBy = req.user.id;

    await department.save();

    // If department name changed, update all users in this department
    if (req.body.name && req.body.name !== department.name) {
      await User.updateMany(
        { department: department.name },
        { department: req.body.name },
      );
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete department (soft delete)
// @route   DELETE /api/departments/:id
// @access  Private/Admin
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Check if department has employees
    const employeeCount = await User.countDocuments({
      department: department.name,
      isActive: true,
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete department with active employees. Please reassign employees first.",
      });
    }

    // Soft delete
    department.isActive = false;
    department.updatedBy = req.user.id;
    await department.save();

    res.json({
      success: true,
      message: "Department deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set department head
// @route   PUT /api/departments/:id/head
// @access  Private/Admin
exports.setDepartmentHead = async (req, res) => {
  try {
    const { userId } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user belongs to this department
    if (user.department !== department.name) {
      return res.status(400).json({
        message: "User must belong to this department to be head",
      });
    }

    // Update user role to manager if not already
    if (user.role !== "manager" && user.role !== "admin") {
      user.role = "manager";
      await user.save();
    }

    department.headOfDepartment = userId;
    department.updatedBy = req.user.id;
    await department.save();

    res.json({
      success: true,
      message: "Department head updated successfully",
      data: {
        department: department.name,
        headOfDepartment: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get department hierarchy
// @route   GET /api/departments/hierarchy
// @access  Private
exports.getDepartmentHierarchy = async (req, res) => {
  try {
    const buildHierarchy = async (parentId = null) => {
      const departments = await Department.find({
        parentDepartment: parentId,
        isActive: true,
      }).populate("headOfDepartment", "name email");

      const hierarchy = await Promise.all(
        departments.map(async (dept) => {
          const children = await buildHierarchy(dept._id);
          const employeeCount = await User.countDocuments({
            department: dept.name,
            isActive: true,
          });

          return {
            _id: dept._id,
            name: dept.name,
            code: dept.code,
            headOfDepartment: dept.headOfDepartment,
            employeeCount,
            children,
          };
        }),
      );

      return hierarchy;
    };

    const hierarchy = await buildHierarchy();

    res.json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get department leave summary
// @route   GET /api/departments/:id/leave-summary
// @access  Private/Manager/Admin
exports.getDepartmentLeaveSummary = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Get all employees in department
    const employees = await User.find({
      department: department.name,
    }).select("name email employeeId role leaveBalance isActive");

    const employeeIds = employees.map((e) => e._id);

    // Get leave summary for date range
    const { startDate, endDate } = req.query;
    let dateFilter = {};

    if (startDate || endDate) {
      dateFilter.appliedOn = {};
      if (startDate) dateFilter.appliedOn.$gte = new Date(startDate);
      if (endDate) dateFilter.appliedOn.$lte = new Date(endDate);
    }

    const leaveSummary = await Leave.aggregate([
      {
        $match: {
          employee: { $in: employeeIds },
          status: { $in: ["approved", "pending"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            status: "$status",
            leaveType: "$leaveType",
          },
          totalDays: { $sum: "$days" },
          count: { $sum: 1 },
          employees: { $addToSet: "$employee" },
        },
      },
      {
        $group: {
          _id: "$_id.status",
          types: {
            $push: {
              leaveType: "$_id.leaveType",
              totalDays: "$totalDays",
              count: "$count",
              uniqueEmployees: { $size: "$employees" },
            },
          },
          totalDays: { $sum: "$totalDays" },
          totalRequests: { $sum: "$count" },
        },
      },
    ]);

    // Calculate leave utilization
    const totalLeaveBalance = employees.reduce(
      (acc, emp) => ({
        annual: acc.annual + (emp.leaveBalance?.annual || 0),
        sick: acc.sick + (emp.leaveBalance?.sick || 0),
        personal: acc.personal + (emp.leaveBalance?.personal || 0),
      }),
      { annual: 0, sick: 0, personal: 0 },
    );

    res.json({
      success: true,
      data: {
        department: department.name,
        employeeCount: employees.length,
        leaveSummary,
        totalLeaveBalance,
        period: {
          startDate: startDate || "All time",
          endDate: endDate || "Present",
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk import departments
// @route   POST /api/departments/bulk-import
// @access  Private/Admin
exports.bulkImportDepartments = async (req, res) => {
  try {
    const { departments } = req.body;

    const results = {
      successful: [],
      failed: [],
    };

    for (const deptData of departments) {
      try {
        // Check if exists
        const existing = await Department.findOne({
          $or: [
            { name: deptData.name },
            { code: deptData.code?.toUpperCase() },
          ],
        });

        if (existing) {
          results.failed.push({
            name: deptData.name,
            reason: "Department already exists",
          });
          continue;
        }

        const department = await Department.create({
          ...deptData,
          code:
            deptData.code?.toUpperCase() ||
            deptData.name.substring(0, 3).toUpperCase(),
          createdBy: req.user.id,
        });

        results.successful.push({
          id: department._id,
          name: department.name,
          code: department.code,
        });
      } catch (error) {
        results.failed.push({
          name: deptData.name,
          reason: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${results.successful.length} departments`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get department analytics
// @route   GET /api/departments/analytics
// @access  Private/Admin
exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const analytics = await Department.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "name",
          foreignField: "department",
          as: "employees",
        },
      },
      {
        $lookup: {
          from: "leaves",
          let: { deptName: "$name" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    "$employee",
                    {
                      $map: {
                        input: "$$deptName",
                        as: "emp",
                        in: "$$emp._id",
                      },
                    },
                  ],
                },
              },
            },
          ],
          as: "leaves",
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          employeeCount: { $size: "$employees" },
          activeEmployees: {
            $size: {
              $filter: {
                input: "$employees",
                as: "emp",
                cond: "$$emp.isActive",
              },
            },
          },
          managerCount: {
            $size: {
              $filter: {
                input: "$employees",
                as: "emp",
                cond: { $eq: ["$$emp.role", "manager"] },
              },
            },
          },
          totalLeaves: { $size: "$leaves" },
          approvedLeaves: {
            $size: {
              $filter: {
                input: "$leaves",
                as: "leave",
                cond: { $eq: ["$$leave.status", "approved"] },
              },
            },
          },
          pendingLeaves: {
            $size: {
              $filter: {
                input: "$leaves",
                as: "leave",
                cond: { $eq: ["$$leave.status", "pending"] },
              },
            },
          },
          totalLeaveDays: {
            $sum: {
              $map: {
                input: "$leaves",
                as: "leave",
                in: "$$leave.days",
              },
            },
          },
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
