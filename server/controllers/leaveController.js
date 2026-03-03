const Leave = require("../models/Leave");
const User = require("../models/User");

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const user = await User.findById(req.user.id);
    if (user.leaveBalance[leaveType] < days && leaveType !== "unpaid") {
      return res.status(400).json({
        message: `Insufficient ${leaveType} leave balance`,
      });
    }

    const leave = await Leave.create({
      employee: req.user.id,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id }).sort(
      "-appliedOn",
    );
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, department } = req.query;
    let query = {};

    if (status) query.status = status;
    if (department) {
      const users = await User.find({ department }).select("_id");
      query.employee = { $in: users.map((u) => u._id) };
    }

    const leaves = await Leave.find(query)
      .populate("employee", "name email department employeeId")
      .populate("approvedBy", "name")
      .sort("-appliedOn");

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (status === "approved" && leave.leaveType !== "unpaid") {
      // Deduct from leave balance
      await User.findByIdAndUpdate(leave.employee, {
        $inc: { [`leaveBalance.${leave.leaveType}`]: -leave.days },
      });
    }

    leave.status = status;
    leave.comments = comments;
    leave.approvedBy = req.user.id;
    leave.approvedOn = Date.now();

    await leave.save();

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLeaveSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("leaveBalance");

    const leaves = await Leave.find({
      employee: req.user.id,
      status: "approved",
      leaveType: { $ne: "unpaid" },
    });

    const usedLeaves = {
      annual: 0,
      sick: 0,
      personal: 0,
    };

    leaves.forEach((leave) => {
      usedLeaves[leave.leaveType] += leave.days;
    });

    res.json({
      balance: user.leaveBalance,
      used: usedLeaves,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel leave request (by employee)
// @route   PUT /api/leaves/:id/cancel
// @access  Private
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if the leave belongs to the user
    if (leave.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this leave' });
    }

    // Check if leave can be cancelled (only pending leaves can be cancelled)
    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot cancel leave with status: ${leave.status}` 
      });
    }

    // Safely access comments with a default value
    const comments = req.body?.comments || 'Cancelled by employee';

    leave.status = 'cancelled';
    leave.comments = comments;
    await leave.save();

    res.json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    res.status(500).json({ message: error.message });
  }
};