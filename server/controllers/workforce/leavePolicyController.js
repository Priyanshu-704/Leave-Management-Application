const { getDefaultPolicy } = require("../workforceUtils");

exports.getLeavePolicy = async (req, res) => {
  try {
    const policy = await getDefaultPolicy();
    res.json(policy.leave || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLeavePolicy = async (req, res) => {
  try {
    const policy = await getDefaultPolicy();
    const { autoApproveEnabled, maxAutoApproveDays, autoApproveTypes } = req.body;

    if (typeof autoApproveEnabled === "boolean") {
      policy.leave.autoApproveEnabled = autoApproveEnabled;
    }
    if (typeof maxAutoApproveDays === "number") {
      policy.leave.maxAutoApproveDays = maxAutoApproveDays;
    }
    if (Array.isArray(autoApproveTypes)) {
      policy.leave.autoApproveTypes = autoApproveTypes;
    }

    await policy.save();
    res.json({ success: true, data: policy.leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
