const Attendance = require("../../models/Attendance");
const Leave = require("../../models/Leave");
const SalarySlip = require("../../models/SalarySlip");
const { getDefaultPolicy, sendCsv, startEndFromMonth } = require("../workforceUtils");

exports.getPayrollPolicy = async (req, res) => {
  try {
    const policy = await getDefaultPolicy();
    res.json(policy.payroll || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePayrollPolicy = async (req, res) => {
  try {
    const policy = await getDefaultPolicy();
    const { monthlyWorkingHours, overtimeRateMultiplier, shortTimePenaltyMultiplier } = req.body;

    if (typeof monthlyWorkingHours === "number") {
      policy.payroll.monthlyWorkingHours = monthlyWorkingHours;
    }
    if (typeof overtimeRateMultiplier === "number") {
      policy.payroll.overtimeRateMultiplier = overtimeRateMultiplier;
    }
    if (typeof shortTimePenaltyMultiplier === "number") {
      policy.payroll.shortTimePenaltyMultiplier = shortTimePenaltyMultiplier;
    }

    await policy.save();
    res.json({ success: true, data: policy.payroll });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateSalary = async (req, res) => {
  try {
    const { userId, month, baseSalary = 0 } = req.body;
    const range = startEndFromMonth(month);

    if (!range) {
      return res.status(400).json({ message: "month must be YYYY-MM" });
    }

    const policy = await getDefaultPolicy();
    const attendanceRows = await Attendance.find({
      employee: userId,
      date: { $gte: range.start, $lte: range.end },
    });

    const approvedLeaves = await Leave.find({
      employee: userId,
      status: "approved",
      leaveType: { $ne: "unpaid" },
      startDate: { $lte: range.end },
      endDate: { $gte: range.start },
    });

    const attendanceDays = attendanceRows.filter((row) => ["present", "late", "half-day"].includes(row.status)).length;
    const totalOvertime = attendanceRows.reduce((sum, row) => sum + (row.overtime || 0), 0);
    const shortTimeHours = attendanceRows.reduce((sum, row) => {
      const diff = 8 - (row.workHours || 0);
      return diff > 0 ? sum + diff : sum;
    }, 0);

    const workingHoursBase = policy.payroll?.monthlyWorkingHours || 176;
    const hourRate = baseSalary / Math.max(1, workingHoursBase);
    const overtimeAmount = totalOvertime * hourRate * (policy.payroll?.overtimeRateMultiplier || 1.5);
    const shortTimeDeduction = shortTimeHours * hourRate * (policy.payroll?.shortTimePenaltyMultiplier || 1);
    const leaveDeduction = Math.max(0, approvedLeaves.length - 2) * 0;
    const attendanceBonusOrCut = ((attendanceDays - 22) * hourRate * 8) / 10;
    const netSalary = Math.max(0, baseSalary + overtimeAmount + attendanceBonusOrCut - shortTimeDeduction - leaveDeduction);

    const slip = await SalarySlip.findOneAndUpdate(
      { employee: userId, month },
      {
        employee: userId,
        month,
        baseSalary,
        attendanceDays,
        overtimeHours: Number(totalOvertime.toFixed(2)),
        shortTimeHours: Number(shortTimeHours.toFixed(2)),
        overtimeAmount: Number(overtimeAmount.toFixed(2)),
        shortTimeDeduction: Number(shortTimeDeduction.toFixed(2)),
        leaveDeduction: Number(leaveDeduction.toFixed(2)),
        netSalary: Number(netSalary.toFixed(2)),
        generatedOn: new Date(),
      },
      { new: true, upsert: true },
    ).populate("employee", "name employeeId department email");

    res.json(slip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSalarySlips = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "employee") {
      query.employee = req.user.id;
    }
    if (req.query.employeeId) {
      query.employee = req.query.employeeId;
    }
    if (req.query.month) {
      query.month = req.query.month;
    }

    const slips = await SalarySlip.find(query)
      .populate("employee", "name employeeId department email")
      .sort({ month: -1, createdAt: -1 });

    res.json(slips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportSalarySlips = async (req, res) => {
  try {
    const slips = await SalarySlip.find()
      .populate("employee", "name employeeId department")
      .sort({ month: -1 });

    return sendCsv(
      res,
      `salary-slips-${new Date().toISOString().slice(0, 10)}.csv`,
      ["month", "employeeId", "name", "department", "baseSalary", "attendanceDays", "overtimeHours", "shortTimeHours", "overtimeAmount", "shortTimeDeduction", "leaveDeduction", "netSalary"],
      slips.map((item) => ({
        month: item.month,
        employeeId: item.employee?.employeeId,
        name: item.employee?.name,
        department: item.employee?.department,
        baseSalary: item.baseSalary,
        attendanceDays: item.attendanceDays,
        overtimeHours: item.overtimeHours,
        shortTimeHours: item.shortTimeHours,
        overtimeAmount: item.overtimeAmount,
        shortTimeDeduction: item.shortTimeDeduction,
        leaveDeduction: item.leaveDeduction,
        netSalary: item.netSalary,
      })),
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
