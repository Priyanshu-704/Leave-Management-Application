const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
  assignEmployees,
  requestShiftSwap,
  respondToSwapRequest,
  calculateOvertime,
  getAllowancesReport,
  rotateShifts,
  getSwapRequests,
  getAssignments,
  getSwapColleagues,
} = require("../controllers/shiftController");

const router = express.Router();

// All routes require authentication
router.use(protect);

// SPECIFIC ROUTES FIRST - these must come before /:id
// ===================================================
// Assignments route
router.get("/assignments", getAssignments);
router.get("/swap-colleagues", getSwapColleagues);

// Swap requests routes
router.get("/swap-requests", getSwapRequests);
router.post("/swap-request", requestShiftSwap);
router.put(
  "/swap-request/:assignmentId",
  authorize("manager", "admin"),
  respondToSwapRequest,
);

// Overtime calculation
router.post(
  "/calculate-overtime",
  authorize("manager", "admin"),
  calculateOvertime,
);

// Allowances report
router.get(
  "/allowances/report",
  authorize("manager", "admin"),
  getAllowancesReport,
);

// Rotation
router.post("/rotate", authorize("admin"), rotateShifts);

// GENERIC ROUTES AFTER - these come after specific routes
// =======================================================
// Get all shifts
router.get("/", getShifts);

// Get single shift by ID - this must come AFTER specific routes
router.get("/:id", getShiftById);

// Create shift
router.post("/", authorize("admin", "manager"), createShift);

// Update shift
router.put("/:id", authorize("admin", "manager"), updateShift);

// Delete shift
router.delete("/:id", authorize("admin"), deleteShift);

// Assign employees to shift
router.post("/:id/assign", authorize("admin", "manager"), assignEmployees);

module.exports = router;
