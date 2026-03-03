const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  applyLeave,
  getUserLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
  getLeaveSummary,
} = require("../controllers/leaveController");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(applyLeave)
  .get(authorize("manager", "admin"), getAllLeaves);

router.put("/:id/cancel", protect, cancelLeave);
router.get("/my-leaves", getUserLeaves);
router.get("/summary", getLeaveSummary);

router.put("/:id/status", authorize("manager", "admin"), updateLeaveStatus);

module.exports = router;
