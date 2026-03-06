const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const ShiftAssignment = require("../models/ShiftAssignment");
const Shift = require("../models/Shift");

const isSuperAdmin = (user) => user?.role === "super_admin";
const isScopedRole = (user) => ["manager", "admin"].includes(user?.role);

const scopeUserIds = async (req, explicitEmployeeId = null) => {
  if (explicitEmployeeId) {
    const target = await User.findById(explicitEmployeeId).select("department");
    if (!target) return { error: "Employee not found" };

    if (isScopedRole(req.user) && !isSuperAdmin(req.user) && target.department !== req.user.department) {
      return { error: "Not authorized" };
    }

    return { userIds: [target._id] };
  }

  if (isScopedRole(req.user) && !isSuperAdmin(req.user)) {
    const users = await User.find({ department: req.user.department, isActive: true }).select("_id");
    return { userIds: users.map((u) => u._id) };
  }

  const users = await User.find({ isActive: true }).select("_id");
  return { userIds: users.map((u) => u._id) };
};

exports.leavePrediction = async (req, res) => {
  try {
    const { employeeId, months = 3 } = req.body;
    const scoped = await scopeUserIds(req, employeeId);
    if (scoped.error) return res.status(403).json({ message: scoped.error });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    const leaves = await Leave.find({
      employee: { $in: scoped.userIds },
      appliedOn: { $gte: startDate },
      status: { $in: ["approved", "pending"] },
    }).select("employee leaveType days appliedOn status");

    const totalDays = leaves.reduce((sum, l) => sum + (l.days || 0), 0);
    const avgPerMonth = Number((totalDays / Number(months || 1)).toFixed(2));
    const predictedNextMonth = Math.max(0, Number((avgPerMonth * 1.1).toFixed(2)));

    return res.json({
      success: true,
      data: {
        analyzedMonths: Number(months),
        sampleSize: leaves.length,
        averageLeaveDaysPerMonth: avgPerMonth,
        predictedLeaveDaysNextMonth: predictedNextMonth,
        confidence: leaves.length >= 10 ? "medium" : "low",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.attendanceAnomalyDetection = async (req, res) => {
  try {
    const { employeeId, days = 30 } = req.query;
    const scoped = await scopeUserIds(req, employeeId);
    if (scoped.error) return res.status(403).json({ message: scoped.error });

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));

    const records = await Attendance.find({
      employee: { $in: scoped.userIds },
      date: { $gte: fromDate },
    })
      .populate("employee", "name department")
      .sort({ date: -1 });

    const anomalies = [];
    records.forEach((r) => {
      if (r.status === "absent") {
        anomalies.push({
          type: "absence",
          severity: "high",
          employee: r.employee,
          date: r.date,
          reason: "Marked absent",
        });
      }

      if (r.isLate) {
        anomalies.push({
          type: "late_checkin",
          severity: "medium",
          employee: r.employee,
          date: r.date,
          reason: `Late by ${r.lateMinutes || 0} minutes`,
        });
      }

      if ((r.workHours || 0) < 4 && r.status === "present") {
        anomalies.push({
          type: "low_hours",
          severity: "medium",
          employee: r.employee,
          date: r.date,
          reason: `Work hours unusually low (${r.workHours || 0})`,
        });
      }
    });

    return res.json({
      success: true,
      data: {
        analyzedRecords: records.length,
        anomaliesFound: anomalies.length,
        anomalies: anomalies.slice(0, 100),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.employeeChurnPrediction = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const scoped = await scopeUserIds(req, employeeId);
    if (scoped.error) return res.status(403).json({ message: scoped.error });

    const users = await User.find({ _id: { $in: scoped.userIds }, isActive: true }).select("name department role createdAt");

    const predictions = await Promise.all(
      users.map(async (u) => {
        const recentLeaves = await Leave.countDocuments({
          employee: u._id,
          appliedOn: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        });

        const recentAbsences = await Attendance.countDocuments({
          employee: u._id,
          status: "absent",
          date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        });

        const tenureMonths = Math.max(
          1,
          (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30),
        );

        let riskScore = 0;
        riskScore += Math.min(40, recentAbsences * 6);
        riskScore += Math.min(30, recentLeaves * 2);
        riskScore += tenureMonths < 6 ? 20 : 5;

        return {
          employee: {
            _id: u._id,
            name: u.name,
            department: u.department,
            role: u.role,
          },
          churnRiskScore: Math.min(100, Math.round(riskScore)),
          churnRiskBand:
            riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low",
          drivers: {
            recentAbsences,
            recentLeaves,
            tenureMonths: Number(tenureMonths.toFixed(1)),
          },
        };
      }),
    );

    return res.json({ success: true, data: predictions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.smartScheduling = async (req, res) => {
  try {
    const { department, startDate, endDate } = req.body;

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    if (isScopedRole(req.user) && !isSuperAdmin(req.user) && req.user.department !== department) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const users = await User.find({ department, isActive: true }).select("_id name employeeId");
    const userIds = users.map((u) => u._id);

    const from = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      employee: { $in: userIds },
      date: { $gte: from, $lte: to },
    }).select("employee isLate lateMinutes workHours status");

    const profileByUser = new Map();
    userIds.forEach((id) => {
      profileByUser.set(String(id), { lateCount: 0, avgWorkHours: 0, totalRecords: 0 });
    });

    attendance.forEach((a) => {
      const key = String(a.employee);
      const stats = profileByUser.get(key);
      if (!stats) return;
      stats.totalRecords += 1;
      stats.avgWorkHours += a.workHours || 0;
      if (a.isLate) stats.lateCount += 1;
    });

    const suggestions = users.map((u) => {
      const stats = profileByUser.get(String(u._id)) || {
        lateCount: 0,
        avgWorkHours: 0,
        totalRecords: 0,
      };
      const avg = stats.totalRecords ? stats.avgWorkHours / stats.totalRecords : 0;

      const recommendedShiftType =
        stats.lateCount > 5 ? "general" : avg > 9 ? "morning" : "evening";

      return {
        employee: {
          _id: u._id,
          name: u.name,
          employeeId: u.employeeId,
        },
        recommendedShiftType,
        rationale:
          stats.lateCount > 5
            ? "Frequent late check-ins, suggest flexible/general shift"
            : avg > 9
              ? "Consistent high work-hours, suitable for morning shift"
              : "Balanced profile, evening shift is suitable",
        metrics: {
          lateCount: stats.lateCount,
          averageWorkHours: Number(avg.toFixed(2)),
          attendanceSamples: stats.totalRecords,
        },
      };
    });

    return res.json({
      success: true,
      data: {
        department,
        period: { startDate: from, endDate: to },
        suggestions,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.chatbotQuery = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Query is required" });
    }

    const q = query.toLowerCase().replace(/\s+/g, " ").trim();

    const greetings = ["hi", "hello", "hey", "good morning", "good evening"];
    const matchedGreeting = greetings.some((token) => q.includes(token));
    if (matchedGreeting) {
      return res.json({
        success: true,
        data: {
          query,
          answer:
            "Hello. I can help with leave balance, pending leave, attendance status, shift details, check-in/check-out guidance, salary slip path, WFH requests, and contact-administrator help.",
        },
      });
    }

    const staticFaq = [
      {
        keywords: ["check in", "check-in", "attendance mark", "punch in"],
        answer:
          "Go to Attendance and use Check In inside allowed office location. If geo-fence blocks check-in, enable location access and retry.",
      },
      {
        keywords: ["check out", "checkout", "punch out"],
        answer:
          "Use Check Out from Attendance before shift end. System sends reminder before check-out cut-off.",
      },
      {
        keywords: ["wfh", "work from home"],
        answer:
          "Open Workforce > Request Work From Home, select date range and reason, then submit for approval.",
      },
      {
        keywords: ["salary slip", "payslip", "pay slip"],
        answer:
          "Open Advanced HR > Salary Slips (route: /workforce/salary-slips) to view and download generated salary slips.",
      },
      {
        keywords: ["contact admin", "administrator", "support"],
        answer:
          "Use Profile > Contact Administrator to send a priority message directly to admin users.",
      },
      {
        keywords: ["holiday", "weekend"],
        answer:
          "Holiday and weekend rules are maintained under Workforce > Weekend and Holiday Maintain.",
      },
    ];

    const staticMatch = staticFaq.find((item) =>
      item.keywords.some((token) => q.includes(token)),
    );
    if (staticMatch) {
      return res.json({ success: true, data: { query, answer: staticMatch.answer } });
    }

    if (q.includes("leave") && q.includes("balance")) {
      const user = await User.findById(req.user.id).select("leaveBalance");
      const leaveBalance = user?.leaveBalance || { annual: 0, sick: 0, personal: 0 };
      return res.json({
        success: true,
        data: {
          query,
          answer: `Your leave balance is Annual: ${leaveBalance.annual}, Sick: ${leaveBalance.sick}, Personal: ${leaveBalance.personal}.`,
        },
      });
    }

    if (q.includes("pending leave") || (q.includes("leave") && q.includes("pending"))) {
      const count = await Leave.countDocuments({ employee: req.user.id, status: "pending" });
      return res.json({
        success: true,
        data: { query, answer: `You have ${count} pending leave request(s).` },
      });
    }

    if (q.includes("shift")) {
      const assignment = await ShiftAssignment.findOne({
        employee: req.user.id,
        endDate: { $exists: false },
      }).populate("shift", "name startTime endTime type");

      if (assignment?.shift) {
        return res.json({
          success: true,
          data: {
            query,
            answer: `Your current shift is ${assignment.shift.name} (${assignment.shift.type}) from ${assignment.shift.startTime} to ${assignment.shift.endTime}.`,
          },
        });
      }
      return res.json({
        success: true,
        data: { query, answer: "No active shift assignment found for your account." },
      });
    }

    if (q.includes("attendance") || q.includes("present") || q.includes("absent")) {
      const recent = await Attendance.findOne({ employee: req.user.id })
        .sort({ date: -1 })
        .select("status date checkIn checkOut workHours");

      if (recent) {
        return res.json({
          success: true,
          data: {
            query,
            answer: `Latest attendance on ${new Date(recent.date).toDateString()}: status ${recent.status}, work hours ${recent.workHours || 0}.`,
          },
        });
      }

      return res.json({
        success: true,
        data: { query, answer: "No attendance record found yet." },
      });
    }

    return res.json({
      success: true,
      data: {
        query,
        answer:
          "I do not have a precise answer for this yet. Try asking about leave balance, pending leave, attendance, shift, WFH, salary slips, or contact administrator.",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const safeMatch = (text, regex) => {
  const match = text.match(regex);
  return match ? match[1].trim() : null;
};

exports.resumeParsing = async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ message: "resumeText is required" });
    }

    const text = resumeText.replace(/\s+/g, " ").trim();

    const email = safeMatch(text, /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phone = safeMatch(text, /(\+?\d[\d\s\-]{8,}\d)/);
    const yearsOfExperience = safeMatch(text.toLowerCase(), /(\d{1,2})\+?\s*years?\s+of\s+experience/);

    const skillsDictionary = [
      "javascript",
      "typescript",
      "react",
      "node",
      "mongodb",
      "python",
      "java",
      "communication",
      "leadership",
      "sql",
      "aws",
      "docker",
    ];

    const lower = text.toLowerCase();
    const skills = skillsDictionary.filter((skill) => lower.includes(skill));

    const lines = resumeText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    return res.json({
      success: true,
      data: {
        name: lines[0] || null,
        email,
        phone,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
        skills,
        summary: text.slice(0, 320),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.sentimentAnalysis = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "text is required" });
    }

    const positiveWords = [
      "good",
      "great",
      "excellent",
      "happy",
      "improved",
      "awesome",
      "positive",
      "supportive",
      "satisfied",
      "love",
    ];
    const negativeWords = [
      "bad",
      "poor",
      "terrible",
      "sad",
      "stressed",
      "angry",
      "negative",
      "issue",
      "problem",
      "hate",
    ];

    const lower = text.toLowerCase();
    const pos = positiveWords.reduce((count, w) => (lower.includes(w) ? count + 1 : count), 0);
    const neg = negativeWords.reduce((count, w) => (lower.includes(w) ? count + 1 : count), 0);

    const score = pos - neg;
    const sentiment = score > 1 ? "positive" : score < -1 ? "negative" : "neutral";

    return res.json({
      success: true,
      data: {
        sentiment,
        score,
        positiveSignals: pos,
        negativeSignals: neg,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.performancePrediction = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const scoped = await scopeUserIds(req, employeeId);
    if (scoped.error) return res.status(403).json({ message: scoped.error });

    const users = await User.find({ _id: { $in: scoped.userIds }, isActive: true }).select("name department role");

    const predictions = await Promise.all(
      users.map(async (u) => {
        const attendance = await Attendance.find({ employee: u._id, date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } })
          .select("isLate status workHours");

        const leaves = await Leave.find({ employee: u._id, appliedOn: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } })
          .select("status days");

        const totalAttendance = attendance.length || 1;
        const presentCount = attendance.filter((a) => a.status === "present").length;
        const lateCount = attendance.filter((a) => a.isLate).length;
        const avgHours = attendance.reduce((sum, a) => sum + (a.workHours || 0), 0) / totalAttendance;
        const leaveDays = leaves.reduce((sum, l) => sum + (l.days || 0), 0);

        const attendanceScore = (presentCount / totalAttendance) * 40;
        const punctualityScore = Math.max(0, 25 - lateCount * 2);
        const productivityScore = Math.min(25, avgHours * 3);
        const availabilityScore = Math.max(0, 10 - Math.min(10, leaveDays));

        const predictedPerformanceScore = Math.round(
          attendanceScore + punctualityScore + productivityScore + availabilityScore,
        );

        return {
          employee: {
            _id: u._id,
            name: u.name,
            department: u.department,
            role: u.role,
          },
          predictedPerformanceScore,
          band:
            predictedPerformanceScore >= 75
              ? "high"
              : predictedPerformanceScore >= 50
                ? "medium"
                : "low",
          factors: {
            presentCount,
            totalAttendance,
            lateCount,
            averageWorkHours: Number(avgHours.toFixed(2)),
            leaveDays,
          },
        };
      }),
    );

    return res.json({ success: true, data: predictions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
