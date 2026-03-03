const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Leave = require("../models/Leave");

// @desc    Check In
// @route   POST /api/attendance/checkin
// @access  Private
exports.checkIn = async (req, res) => {
  try {
    const { location, note, photo } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employee: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "You have already checked in today",
      });
    }

    // Check if employee is on leave today
    const onLeave = await Leave.findOne({
      employee: req.user.id,
      status: "approved",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    let status = "present";
    if (onLeave) {
      status = "on-leave";
    }

    // Get client IP
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Prepare checkin object
    const checkInData = {
      time: new Date(),
      ip,
      device: req.headers["user-agent"],
      note: note || "",
    };

    // Only add location if it exists and has valid coordinates
    if (
      location &&
      location.coordinates &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2
    ) {
      checkInData.location = {
        type: "Point",
        coordinates: location.coordinates,
        address: location.address || "",
      };
    }

    const attendance = await Attendance.create({
      employee: req.user.id,
      date: new Date(),
      checkIn: checkInData,
      status,
      createdBy: req.user.id,
    });

    // Check if late (assuming 9:00 AM start time)
    attendance.checkLate("09:00");
    await attendance.save();

    res.status(201).json({
      success: true,
      message: "Check-in successful",
      data: attendance,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check Out
// @route   PUT /api/attendance/checkout
// @access  Private
exports.checkOut = async (req, res) => {
  try {
    const { location, note, photo } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance
    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (!attendance) {
      return res.status(404).json({
        message: "No check-in record found for today",
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({
        message: "You have already checked out today",
      });
    }

    // Get client IP
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Prepare checkout object - start with just time, ip, device, note
    const checkOutData = {
      time: new Date(),
      ip,
      device: req.headers["user-agent"],
      note: note || "",
    };

    // Only add location if it exists and has valid coordinates
    if (
      location &&
      location.coordinates &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2 &&
      location.coordinates.every(coord => !isNaN(coord))
    ) {
      checkOutData.location = {
        type: "Point",
        coordinates: location.coordinates,
        address: location.address || "",
      };
    }
    // If no valid location, don't include location field at all

    attendance.checkOut = checkOutData;

    // Calculate work hours
    attendance.calculateWorkHours();

    // Check for early departure (assuming 6:00 PM end time)
    if (attendance.checkOut.time) {
      const checkOutHour = attendance.checkOut.time.getHours();
      if (checkOutHour < 18) {
        attendance.earlyDeparture = true;
        attendance.earlyDepartureMinutes = (18 - checkOutHour) * 60;
      }
    }

    attendance.updatedBy = req.user.id;
    await attendance.save();

    res.json({
      success: true,
      message: "Check-out successful",
      data: attendance,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    res.json({
      success: true,
      data: attendance || null,
    });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance history
// @route   GET /api/attendance/history
// @access  Private
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    let query = { employee: req.user.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    // Calculate summary
    const summary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] },
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },
          totalWorkHours: { $sum: "$workHours" },
          totalOvertime: { $sum: "$overtime" },
        },
      },
    ]);

    res.json({
      success: true,
      data: attendance,
      summary: summary[0] || {
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        totalWorkHours: 0,
        totalOvertime: 0,
      },
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all attendance (Admin/Manager)
// @route   GET /api/attendance/all
// @access  Private/Manager/Admin
exports.getAllAttendance = async (req, res) => {
  try {
    const {
      date,
      startDate,
      endDate,
      department,
      status,
      employeeId,
      page = 1,
      limit = 50,
    } = req.query;

    let query = {};

    // Date filtering
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      query.date = {
        $gte: targetDate,
        $lt: nextDate,
      };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by department
    if (department && department !== "all") {
      const users = await User.find({ department }).select("_id");
      query.employee = { $in: users.map((u) => u._id) };
    }

    // Filter by specific employee
    if (employeeId) {
      query.employee = employeeId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
      .populate("employee", "name email employeeId department")
      .sort({ date: -1, "checkIn.time": -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    // Department summary
    const summary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalHours: { $sum: "$workHours" },
        },
      },
    ]);

    res.json({
      success: true,
      data: attendance,
      summary,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all attendance:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private/Manager/Admin
exports.getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    let matchStage = {};

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchStage.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.date.$lte = end;
      }
    }

    // First, get user ids if department filter is applied
    if (department && department !== "all") {
      const users = await User.find({ department }).select("_id");
      matchStage.employee = { $in: users.map((u) => u._id) };
    }

    const stats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalHours: { $sum: "$workHours" },
              },
            },
          ],
          byDepartment: [
            {
              $lookup: {
                from: "users",
                localField: "employee",
                foreignField: "_id",
                as: "userInfo",
              },
            },
            { $unwind: "$userInfo" },
            {
              $group: {
                _id: "$userInfo.department",
                totalEmployees: { $addToSet: "$employee" },
                presentCount: {
                  $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
                },
                lateCount: {
                  $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] },
                },
                totalHours: { $sum: "$workHours" },
              },
            },
            {
              $project: {
                department: "$_id",
                employeeCount: { $size: "$totalEmployees" },
                presentCount: 1,
                lateCount: 1,
                totalHours: 1,
                attendanceRate: {
                  $multiply: [
                    {
                      $divide: ["$presentCount", { $size: "$totalEmployees" }],
                    },
                    100,
                  ],
                },
              },
            },
          ],
          daily: [
            {
              $group: {
                _id: {
                  year: { $year: "$date" },
                  month: { $month: "$date" },
                  day: { $dayOfMonth: "$date" },
                },
                present: {
                  $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
                },
                late: {
                  $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] },
                },
                absent: {
                  $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
                },
                totalHours: { $sum: "$workHours" },
              },
            },
            { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
            { $limit: 30 },
          ],
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add break
// @route   POST /api/attendance/break
// @access  Private
exports.addBreak = async (req, res) => {
  try {
    const { type, note } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (!attendance) {
      return res.status(404).json({
        message: "No active attendance record found",
      });
    }

    if (!attendance.checkIn?.time) {
      return res.status(400).json({
        message: "Please check in first",
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({
        message: "Cannot add break after check out",
      });
    }

    // Check if already on break
    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (lastBreak && !lastBreak.endTime) {
      return res.status(400).json({
        message: "Please end current break first",
      });
    }

    attendance.breaks.push({
      startTime: new Date(),
      type: type || "other",
      note,
    });

    await attendance.save();

    res.json({
      success: true,
      message: "Break started",
      data: attendance,
    });
  } catch (error) {
    console.error("Error adding break:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    End break
// @route   PUT /api/attendance/break/end
// @access  Private
exports.endBreak = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (!attendance) {
      return res.status(404).json({
        message: "No active attendance record found",
      });
    }

    const currentBreak = attendance.breaks.find((b) => !b.endTime);

    if (!currentBreak) {
      return res.status(400).json({
        message: "No active break found",
      });
    }

    currentBreak.endTime = new Date();
    currentBreak.duration =
      (currentBreak.endTime - currentBreak.startTime) / (1000 * 60); // in minutes

    await attendance.save();

    res.json({
      success: true,
      message: "Break ended",
      data: attendance,
    });
  } catch (error) {
    console.error("Error ending break:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manual attendance entry (Admin only)
// @route   POST /api/attendance/manual
// @access  Private/Admin
exports.manualAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status, notes } =
      req.body;

    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this date
    const existing = await Attendance.findOne({
      employee: employeeId,
      date: attendanceDate,
    });

    if (existing) {
      return res.status(400).json({
        message: "Attendance record already exists for this date",
      });
    }

    const attendance = await Attendance.create({
      employee: employeeId,
      date: attendanceDate,
      checkIn: checkInTime
        ? {
            time: new Date(checkInTime),
            note: "Manual entry",
          }
        : null,
      checkOut: checkOutTime
        ? {
            time: new Date(checkOutTime),
            note: "Manual entry",
          }
        : null,
      status: status || "present",
      notes,
      createdBy: req.user.id,
    });

    if (attendance.checkIn?.time && attendance.checkOut?.time) {
      attendance.calculateWorkHours();
      await attendance.save();
    }

    res.status(201).json({
      success: true,
      message: "Manual attendance added successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Error adding manual attendance:", error);
    res.status(500).json({ message: error.message });
  }
};
