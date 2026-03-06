const Leave = require("../models/Leave");
const User = require("../models/User");
const WorkforcePolicy = require("../models/WorkforcePolicy");
const Holiday = require("../models/Holiday");

const isSuperAdmin = (user) => user?.role === "super_admin";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const escapePdfText = (value) =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const normalizeDateStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeDateEnd = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getDefaultPolicy = async () => WorkforcePolicy.findOneAndUpdate(
  { key: "default" },
  { $setOnInsert: { key: "default" } },
  { new: true, upsert: true },
);

const calculateChargeableLeaveDays = async (startDate, endDate) => {
  const policy = await getDefaultPolicy();
  const weekendDays = policy?.holidayWeekend?.weekendDays || [0, 6];
  const holidays = await Holiday.find({
    date: {
      $gte: normalizeDateStart(startDate),
      $lte: normalizeDateEnd(endDate),
    },
  }).select("date");

  const holidaySet = new Set(
    holidays.map((item) => normalizeDateStart(item.date).toISOString().slice(0, 10)),
  );

  let total = 0;
  const cursor = normalizeDateStart(startDate);
  const last = normalizeDateStart(endDate);

  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    if (!weekendDays.includes(cursor.getDay()) && !holidaySet.has(key)) {
      total += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return total;
};

const deductLeaveBalanceIfNeeded = async (leave) => {
  if (!leave || leave.leaveType === "unpaid" || leave.isBalanceDeducted || leave.status !== "approved") {
    return leave;
  }

  const daysToDeduct = Number(leave.deductedDays || leave.days || 0);
  if (daysToDeduct <= 0) {
    leave.isBalanceDeducted = true;
    leave.deductedDays = 0;
    await leave.save();
    return leave;
  }

  await User.findByIdAndUpdate(leave.employee, {
    $inc: { [`leaveBalance.${leave.leaveType}`]: -daysToDeduct },
  });

  leave.isBalanceDeducted = true;
  leave.deductedDays = daysToDeduct;
  await leave.save();
  return leave;
};

const buildLeaveQuery = (userId, query) => {
  const { status, leaveType, dateFrom, dateTo, search } = query;
  const mongoQuery = { employee: userId };

  if (status && status !== "all") {
    mongoQuery.status = status;
  }

  if (leaveType && leaveType !== "all") {
    mongoQuery.leaveType = leaveType;
  }

  if (dateFrom || dateTo) {
    mongoQuery.startDate = {};
    if (dateFrom) mongoQuery.startDate.$gte = new Date(dateFrom);
    if (dateTo) mongoQuery.startDate.$lte = new Date(dateTo);
  }

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    mongoQuery.$or = [{ reason: regex }, { leaveType: regex }, { status: regex }];
  }

  return mongoQuery;
};

const buildPdfBuffer = (lines) => {
  const linesPerPage = 45;
  const pages = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  const objects = [];
  const addObject = (num, content) => {
    objects.push({ num, content: `${num} 0 obj\n${content}\nendobj\n` });
  };

  const catalogObj = 1;
  const pagesObj = 2;
  const fontObj = 3;
  let currentObj = 4;

  const pageObjectNumbers = [];
  const contentObjectNumbers = [];

  pages.forEach(() => {
    pageObjectNumbers.push(currentObj++);
    contentObjectNumbers.push(currentObj++);
  });

  addObject(
    catalogObj,
    `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`,
  );
  addObject(
    pagesObj,
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`,
  );
  addObject(
    fontObj,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  );

  pages.forEach((pageLines, idx) => {
    const pageObj = pageObjectNumbers[idx];
    const contentObj = contentObjectNumbers[idx];

    const contentLines = ["BT", "/F1 10 Tf", "40 780 Td"];
    pageLines.forEach((line, lineIndex) => {
      const safeLine = escapePdfText(line).slice(0, 120);
      if (lineIndex === 0) {
        contentLines.push(`(${safeLine}) Tj`);
      } else {
        contentLines.push("0 -16 Td");
        contentLines.push(`(${safeLine}) Tj`);
      }
    });
    contentLines.push("ET");
    const streamContent = `${contentLines.join("\n")}\n`;

    addObject(
      pageObj,
      `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`,
    );
    addObject(
      contentObj,
      `<< /Length ${Buffer.byteLength(streamContent, "utf8")} >>\nstream\n${streamContent}endstream`,
    );
  });

  objects.sort((a, b) => a.num - b.num);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets[obj.num] = Buffer.byteLength(pdf, "utf8");
    pdf += obj.content;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i += 1) {
    const offset = String(offsets[i] || 0).padStart(10, "0");
    pdf += `${offset} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
};

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const chargeableDays = await calculateChargeableLeaveDays(startDate, endDate);
    const leavePolicy = await getDefaultPolicy();

    // Check leave balance
    const user = await User.findById(req.user.id);
    if (user.leaveBalance[leaveType] < chargeableDays && leaveType !== "unpaid") {
      return res.status(400).json({
        message: `Insufficient ${leaveType} leave balance`,
      });
    }

    const shouldAutoApprove =
      leavePolicy?.leave?.autoApproveEnabled &&
      leaveType !== "unpaid" &&
      Number(chargeableDays) <= Number(leavePolicy?.leave?.maxAutoApproveDays || 0) &&
      (leavePolicy?.leave?.autoApproveTypes || []).includes(leaveType);

    const leave = await Leave.create({
      employee: req.user.id,
      leaveType,
      startDate,
      endDate,
      days: totalDays,
      deductedDays: chargeableDays,
      reason,
      status: shouldAutoApprove ? "approved" : "pending",
      autoApproved: Boolean(shouldAutoApprove),
      approvedBy: shouldAutoApprove ? req.user.id : null,
      approvedOn: shouldAutoApprove ? new Date() : null,
    });

    if (shouldAutoApprove) {
      await deductLeaveBalanceIfNeeded(leave);
    }

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id }).sort("-appliedOn");
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export user leaves (PDF/Excel)
// @route   GET /api/leaves/my-leaves/export
// @access  Private
exports.exportUserLeaves = async (req, res) => {
  try {
    const { format = "pdf" } = req.query;
    const query = buildLeaveQuery(req.user.id, req.query);
    const leaves = await Leave.find(query).sort("-appliedOn");

    if (format === "excel") {
      const rows = leaves
        .map(
          (leave) => `
            <tr>
              <td>${leave.leaveType}</td>
              <td>${formatDate(leave.startDate)}</td>
              <td>${formatDate(leave.endDate)}</td>
              <td>${leave.days}</td>
              <td>${leave.status}</td>
              <td>${formatDate(leave.appliedOn)}</td>
              <td>${(leave.reason || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
              <td>${(leave.comments || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
            </tr>
          `,
        )
        .join("");

      const html = `
        <html>
          <head><meta charset="utf-8" /></head>
          <body>
            <table border="1">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Reason</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `;

      const fileName = `leave-history-${new Date().toISOString().slice(0, 10)}.xls`;
      res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      return res.send(html);
    }

    const lines = [
      "Leave History Report",
      `Generated On: ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
      " ",
      "Type | Start | End | Days | Status | Applied On | Reason",
      "-----------------------------------------------------------------------",
      ...leaves.map((leave) => {
        const reason = (leave.reason || "").replace(/\s+/g, " ").slice(0, 40);
        return `${leave.leaveType} | ${formatDate(leave.startDate)} | ${formatDate(leave.endDate)} | ${leave.days} | ${leave.status} | ${formatDate(leave.appliedOn)} | ${reason}`;
      }),
    ];

    const pdfBuffer = buildPdfBuffer(lines);
    const fileName = `leave-history-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error exporting leave history:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, department } = req.query;
    let query = {};

    if (status) query.status = status;

    const isScopedApprover = ["manager", "admin"].includes(req.user.role);
    if (isScopedApprover && !isSuperAdmin(req.user)) {
      if (department && department !== req.user.department) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const users = await User.find({ department: req.user.department }).select(
        "_id",
      );
      query.employee = { $in: users.map((u) => u._id) };
    } else if (department) {
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
    const leave = await Leave.findById(req.params.id).populate(
      "employee",
      "department",
    );

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (
      ["manager", "admin"].includes(req.user.role) &&
      !isSuperAdmin(req.user) &&
      leave.employee?.department !== req.user.department
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    leave.status = status;
    leave.comments = comments;
    leave.approvedBy = req.user.id;
    leave.approvedOn = Date.now();

    await leave.save();
    await deductLeaveBalanceIfNeeded(leave);

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
      usedLeaves[leave.leaveType] += leave.deductedDays || leave.days;
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

    // Check if leave can be cancelled (pending / auto-approved can be cancelled)
    if (!['pending', 'approved'].includes(leave.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel leave with status: ${leave.status}` 
      });
    }

    if (leave.status === "approved" && leave.isBalanceDeducted && leave.leaveType !== "unpaid") {
      await User.findByIdAndUpdate(leave.employee, {
        $inc: { [`leaveBalance.${leave.leaveType}`]: Number(leave.deductedDays || leave.days || 0) },
      });
      leave.isBalanceDeducted = false;
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
