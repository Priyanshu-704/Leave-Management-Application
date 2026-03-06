const express = require("express");
const { protect, authorizeFeature } = require("../middleware/auth");
const { getLeavePolicy, updateLeavePolicy } = require("../controllers/workforce/leavePolicyController");

const router = express.Router();

router.use(protect);

router.get("/", authorizeFeature("automaticLeaveApproval"), getLeavePolicy);
router.put("/", authorizeFeature("automaticLeaveApproval"), updateLeavePolicy);

module.exports = router;
