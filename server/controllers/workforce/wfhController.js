const WorkFromHomeRequest = require("../../models/WorkFromHomeRequest");
const User = require("../../models/User");
const { sendCsv } = require("../workforceUtils");

exports.requestWfh = async (req, res) => {
  try {
    const request = await WorkFromHomeRequest.create({ ...req.body, employee: req.user.id });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWfhRequests = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "employee") {
      query.employee = req.user.id;
    } else if (req.user.role === "manager") {
      const users = await User.find({ department: req.user.department }).select("_id");
      query.employee = { $in: users.map((u) => u._id) };
    }

    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    const requests = await WorkFromHomeRequest.find(query)
      .populate("employee", "name email department employeeId")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateWfhStatus = async (req, res) => {
  try {
    const request = await WorkFromHomeRequest.findById(req.params.id).populate("employee", "department");
    if (!request) {
      return res.status(404).json({ message: "WFH request not found" });
    }

    if (req.user.role === "manager" && request.employee?.department !== req.user.department) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = req.body.status || request.status;
    request.comments = req.body.comments || request.comments;
    request.approvedBy = req.user.id;
    request.approvedOn = new Date();
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportWfh = async (req, res) => {
  try {
    const requests = await WorkFromHomeRequest.find()
      .populate("employee", "name department employeeId")
      .sort({ createdAt: -1 });

    return sendCsv(
      res,
      `wfh-requests-${new Date().toISOString().slice(0, 10)}.csv`,
      ["employeeId", "name", "department", "startDate", "endDate", "status", "reason", "comments"],
      requests.map((item) => ({
        employeeId: item.employee?.employeeId,
        name: item.employee?.name,
        department: item.employee?.department,
        startDate: item.startDate?.toISOString().slice(0, 10),
        endDate: item.endDate?.toISOString().slice(0, 10),
        status: item.status,
        reason: item.reason,
        comments: item.comments,
      })),
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
