const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/joiValidation");
const { applyLeaveSchema, updateLeaveStatusSchema } = require("../validators/leaveValidators");
const {
  applyLeave,
  getUserLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
  getLeaveSummary,
  exportUserLeaves,
} = require("../controllers/leaveController");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(validate(applyLeaveSchema), applyLeave)
  .get(authorize("manager", "admin"), getAllLeaves);

router.put("/:id/cancel", protect, cancelLeave);
router.get("/my-leaves", getUserLeaves);
router.get("/summary", getLeaveSummary);
router.get("/my-leaves/export", exportUserLeaves);

router.put("/:id/status", authorize("manager", "admin"), validate(updateLeaveStatusSchema), updateLeaveStatus);

module.exports = router;
