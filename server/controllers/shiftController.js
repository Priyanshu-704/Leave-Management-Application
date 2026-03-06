const Shift = require("../models/Shift");
const ShiftAssignment = require("../models/ShiftAssignment");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

const isSuperAdmin = (user) => user?.role === "super_admin";
const isDepartmentScopedUser = (user) =>
  ["admin", "manager"].includes(user?.role);

// @desc    Create new shift
// @route   POST /api/shifts
// @access  Private/Admin/Manager
exports.createShift = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      startTime,
      endTime,
      gracePeriod,
      latePenaltyAfter,
      requiresNextDay,
      breakDuration,
      applicableDays,
      allowances,
      department,
      assignedEmployees,
      rotationEnabled,
      rotationFrequency,
      rotationGroup,
      description,
    } = req.body;

    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      if (department && department !== req.user.department) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    const shiftDepartment =
      isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)
        ? req.user.department
        : department;

    // Check if shift code already exists
    const existingShift = await Shift.findOne({ code: code.toUpperCase() });
    if (existingShift) {
      return res.status(400).json({ message: "Shift code already exists" });
    }

    // Calculate totalHours manually to ensure it's set
    const start = startTime.split(":").map(Number);
    const end = endTime.split(":").map(Number);

    let startMinutes = start[0] * 60 + start[1];
    let endMinutes = end[0] * 60 + end[1];

    if (requiresNextDay) {
      endMinutes += 24 * 60;
    }

    const totalHours = (endMinutes - startMinutes) / 60;

    const shift = await Shift.create({
      name,
      code: code.toUpperCase(),
      type,
      startTime,
      endTime,
      gracePeriod,
      latePenaltyAfter,
      requiresNextDay,
      totalHours, // Set explicitly
      breakDuration,
      applicableDays: applicableDays || [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
      ],
      allowances: allowances || {
        baseRate: 1.0,
        overtimeRate: 1.5,
        nightDifferential: 1.1,
        weekendRate: 1.5,
        holidayRate: 2.0,
        shiftAllowance: 0,
        mealAllowance: 0,
        transportAllowance: 0,
      },
      department: shiftDepartment,
      assignedEmployees: assignedEmployees || [],
      rotationEnabled: rotationEnabled || false,
      rotationFrequency: rotationFrequency || "weekly",
      rotationGroup: rotationGroup || "A",
      description,
      createdBy: req.user.id,
    });

    // Create assignments for employees
    if (assignedEmployees && assignedEmployees.length > 0) {
      if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
        const users = await User.find({
          _id: { $in: assignedEmployees },
          department: req.user.department,
          isActive: true,
        }).select("_id");
        if (users.length !== assignedEmployees.length) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }

      await Promise.all(
        assignedEmployees.map((employeeId) =>
          ShiftAssignment.create({
            employee: employeeId,
            shift: shift._id,
            startDate: new Date(),
            isPermanent: true,
            rotationGroup,
            createdBy: req.user.id,
          }),
        ),
      );
    }

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: shift,
    });
  } catch (error) {
    console.error("Error creating shift:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all shifts
// @route   GET /api/shifts
// @access  Private
exports.getShifts = async (req, res) => {
  try {
    const { type, department, isActive, page = 1, limit = 20 } = req.query;

    let query = {};

    if (type && type !== "all") query.type = type;
    if (department && department !== "all") query.department = department;
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Role-based filtering
    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      query.department = req.user.department;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const shifts = await Shift.find(query)
      .populate("assignedEmployees", "name email employeeId")
      .populate("createdBy", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ type: 1, name: 1 });

    const total = await Shift.countDocuments(query);

    res.json({
      success: true,
      data: shifts,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single shift
// @route   GET /api/shifts/:id
// @access  Private
exports.getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate("assignedEmployees", "name email employeeId department")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    if (
      isDepartmentScopedUser(req.user) &&
      !isSuperAdmin(req.user) &&
      shift.department !== req.user.department
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get current assignments
    const assignments = await ShiftAssignment.find({
      shift: shift._id,
      endDate: { $exists: false },
    })
      .populate("employee", "name email employeeId")
      .populate("swapRequest.requestedWith", "name");

    res.json({
      success: true,
      data: {
        ...shift.toObject(),
        currentAssignments: assignments,
      },
    });
  } catch (error) {
    console.error("Error fetching shift:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update shift
// @route   PUT /api/shifts/:id
// @access  Private/Admin/Manager
exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    // Check permission
    if (
      isDepartmentScopedUser(req.user) &&
      !isSuperAdmin(req.user) &&
      shift.department !== req.user.department
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatableFields = [
      "name",
      "startTime",
      "endTime",
      "gracePeriod",
      "latePenaltyAfter",
      "requiresNextDay",
      "breakDuration",
      "applicableDays",
      "allowances",
      "rotationEnabled",
      "rotationFrequency",
      "rotationGroup",
      "description",
      "isActive",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        shift[field] = req.body[field];
      }
    });

    // Update code if provided
    if (req.body.code) {
      shift.code = req.body.code.toUpperCase();
    }

    // Recalculate totalHours if times changed
    if (
      req.body.startTime ||
      req.body.endTime ||
      req.body.requiresNextDay !== undefined
    ) {
      const start = (req.body.startTime || shift.startTime)
        .split(":")
        .map(Number);
      const end = (req.body.endTime || shift.endTime).split(":").map(Number);

      let startMinutes = start[0] * 60 + start[1];
      let endMinutes = end[0] * 60 + end[1];

      if (
        req.body.requiresNextDay !== undefined
          ? req.body.requiresNextDay
          : shift.requiresNextDay
      ) {
        endMinutes += 24 * 60;
      }

      shift.totalHours = (endMinutes - startMinutes) / 60;
    }

    shift.updatedBy = req.user.id;
    await shift.save();

    res.json({
      success: true,
      message: "Shift updated successfully",
      data: shift,
    });
  } catch (error) {
    console.error("Error updating shift:", error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Delete shift
// @route   DELETE /api/shifts/:id
// @access  Private/Admin
exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    if (
      isDepartmentScopedUser(req.user) &&
      !isSuperAdmin(req.user) &&
      shift.department !== req.user.department
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if shift has active assignments
    const activeAssignments = await ShiftAssignment.countDocuments({
      shift: shift._id,
      endDate: { $exists: false },
    });

    if (activeAssignments > 0) {
      return res.status(400).json({
        message: "Cannot delete shift with active assignments",
      });
    }

    // Soft delete
    shift.isActive = false;
    await shift.save();

    res.json({
      success: true,
      message: "Shift deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shift:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign employees to shift
// @route   POST /api/shifts/:id/assign
// @access  Private/Admin/Manager
exports.assignEmployees = async (req, res) => {
  try {
    const { employeeIds, startDate, isPermanent } = req.body;
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    if (
      isDepartmentScopedUser(req.user) &&
      !isSuperAdmin(req.user) &&
      shift.department !== req.user.department
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      const users = await User.find({
        _id: { $in: employeeIds || [] },
        department: req.user.department,
        isActive: true,
      }).select("_id");
      if (users.length !== (employeeIds || []).length) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    // End current assignments for these employees
    await ShiftAssignment.updateMany(
      {
        employee: { $in: employeeIds },
        endDate: { $exists: false },
      },
      {
        endDate: new Date(),
      },
    );

    // Create new assignments
    const assignments = await Promise.all(
      employeeIds.map((employeeId) =>
        ShiftAssignment.create({
          employee: employeeId,
          shift: shift._id,
          startDate: new Date(startDate),
          isPermanent: isPermanent || false,
          rotationGroup: shift.rotationGroup,
          createdBy: req.user.id,
        }),
      ),
    );

    // Update shift's assignedEmployees
    shift.assignedEmployees = [
      ...new Set([...shift.assignedEmployees, ...employeeIds]),
    ];
    await shift.save();

    res.json({
      success: true,
      message: "Employees assigned successfully",
      data: assignments,
    });
  } catch (error) {
    console.error("Error assigning employees:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get shift assignments
// @route   GET /api/shifts/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
  try {
    const { employee, shift, active } = req.query;
    const query = {};

    if (employee) {
      if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
        const employeeUser = await User.findById(employee).select("department");
        if (!employeeUser || employeeUser.department !== req.user.department) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }
      query.employee = employee;
    }
    if (shift) query.shift = shift;

    if (active === "true") {
      query.$or = [{ endDate: { $exists: false } }, { endDate: null }];
    }

    if (!employee) {
      if (req.user.role === "employee") {
        query.employee = req.user.id;
      } else if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
        const managerUsers = await User.find({
          department: req.user.department,
        }).select("_id");
        query.employee = { $in: managerUsers.map((u) => u._id) };
      }
    }

    const assignments = await ShiftAssignment.find(query)
      .populate("employee", "name email employeeId department")
      .populate("shift", "name code startTime endTime type department")
      .sort({ startDate: -1 });

    res.json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request shift swap
// @route   POST /api/shifts/swap-request
// @access  Private
exports.requestShiftSwap = async (req, res) => {
  try {
    const {
      currentAssignmentId,
      targetEmployeeId,
      targetShiftId,
      swapDate,
      reason,
    } = req.body;

    // Validate required fields
    if (
      !currentAssignmentId ||
      !targetEmployeeId ||
      !targetShiftId ||
      !swapDate
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const currentAssignment =
      await ShiftAssignment.findById(currentAssignmentId);

    if (!currentAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if user owns this assignment
    if (currentAssignment.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if assignment is still active
    if (currentAssignment.endDate) {
      return res.status(400).json({
        message: "Cannot request swap for an inactive assignment",
      });
    }

    // Check if there's already a pending request
    if (
      currentAssignment.swapRequest?.isRequested &&
      currentAssignment.swapRequest?.status === "pending"
    ) {
      return res.status(400).json({
        message: "You already have a pending swap request for this shift",
      });
    }

    // Validate target employee active assignment
    const targetAssignment = await ShiftAssignment.findOne({
      employee: targetEmployeeId,
      shift: targetShiftId,
      $or: [{ endDate: { $exists: false } }, { endDate: null }],
    });

    if (!targetAssignment) {
      return res.status(400).json({
        message: "Target employee does not have an active assignment for that shift",
      });
    }

    const currentEmployee = await User.findById(req.user.id).select("department");
    const targetEmployee = await User.findById(targetEmployeeId).select("department");
    if (
      !currentEmployee ||
      !targetEmployee ||
      currentEmployee.department !== targetEmployee.department
    ) {
      return res.status(400).json({
        message: "Shift swap can only be requested within same department",
      });
    }

    // Create swap request
    currentAssignment.swapRequest = {
      isRequested: true,
      requestedWith: targetEmployeeId,
      requestedShift: targetShiftId,
      requestedDate: swapDate,
      reason: reason || "",
      status: "pending",
    };

    await currentAssignment.save();

    // TODO: Send notification to target employee and manager

    res.json({
      success: true,
      message: "Swap request sent successfully",
      data: currentAssignment,
    });
  } catch (error) {
    console.error("Error requesting swap:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/reject shift swap
// @route   PUT /api/shifts/swap-request/:assignmentId
// @access  Private/Manager
exports.respondToSwapRequest = async (req, res) => {
  try {
    const { status, comments } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const assignment = await ShiftAssignment.findById(req.params.assignmentId)
      .populate("employee")
      .populate("shift");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if user is manager of the department
    if (
      !isSuperAdmin(req.user) &&
      req.user.department !== assignment.employee.department
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!assignment.swapRequest?.isRequested) {
      return res.status(400).json({ message: "No swap request found" });
    }

    if (assignment.swapRequest.status !== "pending") {
      return res.status(400).json({ message: "Swap request already processed" });
    }

    assignment.swapRequest.status = status;
    assignment.swapRequest.comments = comments;
    assignment.swapRequest.approvedBy = req.user.id;
    assignment.swapRequest.approvedAt = new Date();

    await assignment.save();

    // If approved, perform the swap
    if (status === "approved") {
      const swapDate = new Date(assignment.swapRequest.requestedDate || new Date());
      const requesterId = assignment.employee._id;
      const requesterShiftId = assignment.shift._id;
      const targetEmployeeId = assignment.swapRequest.requestedWith;
      const targetShiftId = assignment.swapRequest.requestedShift;

      const targetAssignment = await ShiftAssignment.findOne({
        employee: targetEmployeeId,
        shift: targetShiftId,
        $or: [{ endDate: { $exists: false } }, { endDate: null }],
      });

      if (!targetAssignment) {
        return res.status(400).json({
          message: "Target assignment is no longer active",
        });
      }

      // End current assignments from swap date
      assignment.endDate = swapDate;
      targetAssignment.endDate = swapDate;
      assignment.updatedBy = req.user.id;
      targetAssignment.updatedBy = req.user.id;
      await targetAssignment.save();
      await assignment.save();

      // Create swapped assignments
      await ShiftAssignment.create({
        employee: requesterId,
        shift: targetShiftId,
        startDate: swapDate,
        isPermanent: assignment.isPermanent,
        rotationGroup: assignment.rotationGroup,
        createdBy: req.user.id,
      });

      await ShiftAssignment.create({
        employee: targetEmployeeId,
        shift: requesterShiftId,
        startDate: swapDate,
        isPermanent: targetAssignment.isPermanent,
        rotationGroup: targetAssignment.rotationGroup,
        createdBy: req.user.id,
      });
    }

    res.json({
      success: true,
      message: `Swap request ${status}`,
      data: assignment,
    });
  } catch (error) {
    console.error("Error responding to swap request:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate overtime
// @route   POST /api/shifts/calculate-overtime
// @access  Private/Manager/Admin
exports.calculateOvertime = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.body;

    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      const employee = await User.findById(employeeId).select("department");
      if (!employee || employee.department !== req.user.department) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    const attendances = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: "present",
    }).populate({
      path: "employee",
      populate: {
        path: "shiftAssignment",
        populate: { path: "shift" },
      },
    });

    const overtimeDetails = [];

    for (const attendance of attendances) {
      const assignment = await ShiftAssignment.findOne({
        employee: employeeId,
        startDate: { $lte: attendance.date },
        $or: [
          { endDate: { $gte: attendance.date } },
          { endDate: { $exists: false } },
        ],
      }).populate("shift");

      if (!assignment) continue;

      const shift = assignment.shift;
      const workHours = attendance.workHours || 0;
      const regularHours = shift.totalHours;

      let overtime = 0;
      if (workHours > regularHours) {
        overtime = workHours - regularHours;
      }

      // Check if it's weekend
      const dayOfWeek = attendance.date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

      // Check if it's holiday (you'd need a holiday model)
      const isHoliday = false; // Implement holiday check

      let rate = 1.0;
      if (isHoliday) {
        rate = shift.allowances.holidayRate;
      } else if (isWeekend) {
        rate = shift.allowances.weekendRate;
      } else if (shift.type === "night") {
        rate = shift.allowances.nightDifferential;
      } else if (overtime > 0) {
        rate = shift.allowances.overtimeRate;
      }

      overtimeDetails.push({
        date: attendance.date,
        workHours,
        regularHours,
        overtime,
        rate,
        shiftType: shift.type,
        isWeekend,
        isHoliday,
        calculatedAmount: overtime * rate, // This would be multiplied by hourly rate
      });
    }

    res.json({
      success: true,
      data: overtimeDetails,
      summary: {
        totalOvertime: overtimeDetails.reduce((sum, d) => sum + d.overtime, 0),
        totalAmount: overtimeDetails.reduce(
          (sum, d) => sum + d.calculatedAmount,
          0,
        ),
      },
    });
  } catch (error) {
    console.error("Error calculating overtime:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get shift allowances report
// @route   GET /api/shifts/allowances-report
// @access  Private/Admin/Manager
exports.getAllowancesReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    let matchStage = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      if (department && department !== req.user.department && department !== "all") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const users = await User.find({ department: req.user.department }).select("_id");
      matchStage.employee = { $in: users.map((u) => u._id) };
    } else if (department && department !== "all") {
      const users = await User.find({ department }).select("_id");
      matchStage.employee = { $in: users.map((u) => u._id) };
    }

    const report = await Attendance.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "shiftassignments",
          localField: "employee",
          foreignField: "employee",
          as: "assignment",
        },
      },
      { $unwind: "$assignment" },
      {
        $lookup: {
          from: "shifts",
          localField: "assignment.shift",
          foreignField: "_id",
          as: "shift",
        },
      },
      { $unwind: "$shift" },
      {
        $group: {
          _id: {
            employee: "$employee",
            shiftType: "$shift.type",
          },
          totalHours: { $sum: "$workHours" },
          baseAmount: {
            $sum: {
              $multiply: ["$workHours", "$shift.allowances.baseRate"],
            },
          },
          nightDifferential: {
            $sum: {
              $cond: [
                { $eq: ["$shift.type", "night"] },
                {
                  $multiply: [
                    "$workHours",
                    "$shift.allowances.nightDifferential",
                  ],
                },
                0,
              ],
            },
          },
          shiftAllowance: { $first: "$shift.allowances.shiftAllowance" },
          mealAllowance: { $first: "$shift.allowances.mealAllowance" },
          transportAllowance: {
            $first: "$shift.allowances.transportAllowance",
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating allowances report:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rotate shifts automatically
// @route   POST /api/shifts/rotate
// @access  Private/Admin
exports.rotateShifts = async (req, res) => {
  try {
    const shiftsQuery = { rotationEnabled: true, isActive: true };
    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      shiftsQuery.department = req.user.department;
    }
    const shifts = await Shift.find(shiftsQuery);

    for (const shift of shifts) {
      const assignments = await ShiftAssignment.find({
        shift: shift._id,
        endDate: { $exists: false },
      }).populate("employee");

      // Group by rotation group
      const groups = {};
      assignments.forEach((a) => {
        const group = a.rotationGroup || "A";
        if (!groups[group]) groups[group] = [];
        groups[group].push(a);
      });

      // Rotate groups (A->B, B->C, etc.)
      const groupOrder = ["A", "B", "C", "D"];
      const newAssignments = [];

      for (let i = 0; i < groupOrder.length; i++) {
        const currentGroup = groupOrder[i];
        const nextGroup = groupOrder[(i + 1) % groupOrder.length];

        if (groups[currentGroup]) {
          // End current assignments
          await ShiftAssignment.updateMany(
            { _id: { $in: groups[currentGroup].map((a) => a._id) } },
            { endDate: new Date() },
          );

          // Create new assignments for next shift
          // This would need logic to determine next shift
        }
      }
    }

    res.json({
      success: true,
      message: "Shifts rotated successfully",
    });
  } catch (error) {
    console.error("Error rotating shifts:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get swap requests for current user
// @route   GET /api/shifts/swap-requests
// @access  Private
exports.getSwapRequests = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};

    // Filter by status if provided
    if (status && status !== "all") {
      query["swapRequest.status"] = status;
    }

    const baseQuery = {
      "swapRequest.isRequested": true,
      ...query,
    };

    // Role based visibility
    if (req.user.role === "employee") {
      baseQuery.$or = [
        { employee: req.user.id },
        { "swapRequest.requestedWith": req.user.id },
      ];
    } else if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      const managerUsers = await User.find({
        department: req.user.department,
      }).select("_id");
      baseQuery.employee = { $in: managerUsers.map((u) => u._id) };
    }

    const assignments = await ShiftAssignment.find(baseQuery)
      .populate("employee", "name email employeeId")
      .populate("shift", "name code startTime endTime type")
      .populate("swapRequest.requestedWith", "name email employeeId")
      .populate(
        "swapRequest.requestedShift",
        "name code startTime endTime type",
      )
      .populate("swapRequest.approvedBy", "name email")
      .sort("-createdAt");

    // Format the response
    const swapRequests = assignments.map((assignment) => ({
      _id: assignment._id,
      employee: assignment.employee,
      shift: assignment.shift,
      requestedWith: assignment.swapRequest?.requestedWith,
      requestedShift: assignment.swapRequest?.requestedShift,
      requestedDate: assignment.swapRequest?.requestedDate,
      reason: assignment.swapRequest?.reason,
      status: assignment.swapRequest?.status,
      comments: assignment.swapRequest?.comments,
      approvedBy: assignment.swapRequest?.approvedBy,
      approvedAt: assignment.swapRequest?.approvedAt,
      createdAt: assignment.createdAt,
      isRequester: assignment.employee?._id?.toString() === req.user.id,
    }));

    res.json({
      success: true,
      count: swapRequests.length,
      data: swapRequests,
    });
  } catch (error) {
    console.error("Error fetching swap requests:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get eligible colleagues for swap
// @route   GET /api/shifts/swap-colleagues
// @access  Private
exports.getSwapColleagues = async (req, res) => {
  try {
    const { shiftId } = req.query;

    let department = req.user.department;

    if (shiftId) {
      const shift = await Shift.findById(shiftId).select("department");
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      if (
        isDepartmentScopedUser(req.user) &&
        !isSuperAdmin(req.user) &&
        shift.department !== req.user.department
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }
      department = shift.department;
    }

    const colleagues = await User.find({
      _id: { $ne: req.user.id },
      isActive: true,
      department,
    })
      .select("name email employeeId department role")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: colleagues.length,
      data: colleagues,
    });
  } catch (error) {
    console.error("Error fetching swap colleagues:", error);
    res.status(500).json({ message: error.message });
  }
};
