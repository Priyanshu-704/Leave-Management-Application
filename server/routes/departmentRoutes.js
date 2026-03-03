const express = require("express");
const { body } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  setDepartmentHead,
  getDepartmentHierarchy,
  getDepartmentLeaveSummary,
  bulkImportDepartments,
  getDepartmentAnalytics,
} = require("../controllers/departmentController");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (accessible by authenticated users)
router.get("/", getDepartments);
router.get("/hierarchy", getDepartmentHierarchy);
router.get("/analytics", authorize("admin"), getDepartmentAnalytics);
router.get("/:id", getDepartmentById);
router.get(
  "/:id/leave-summary",
  authorize("manager", "admin"),
  getDepartmentLeaveSummary,
);

// Admin only routes
router.post(
  "/",
  authorize("admin"),
  [body("name").notEmpty().trim(), body("code").optional().trim()],
  createDepartment,
);

router.put("/:id", authorize("admin"), updateDepartment);

router.delete("/:id", authorize("admin"), deleteDepartment);

router.put(
  "/:id/head",
  authorize("admin"),
  [body("userId").notEmpty().isMongoId()],
  setDepartmentHead,
);


router.post("/bulk-import", authorize("admin"), bulkImportDepartments);

module.exports = router;
