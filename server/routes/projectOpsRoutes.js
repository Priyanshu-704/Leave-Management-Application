const express = require("express");
const { protect, authorizeFeature } = require("../middleware/auth");
const {
  listProjects,
  createProject,
  listProjectAllocations,
  createProjectAllocation,
  listTasks,
  createTask,
  updateTask,
  listTimesheets,
  createTimesheet,
  exportTimesheets,
  listBillings,
  createBilling,
  exportBillings,
  listResourcePlans,
  createResourcePlan,
  listMilestones,
  createMilestone,
  updateMilestone,
  getGanttData,
  getCapacityPlanning,
  exportCapacityPlanning,
} = require("../controllers/workforce/projectOpsController");

const router = express.Router();

router.use(protect);

router.get("/projects", authorizeFeature("projectAllocation"), listProjects);
router.post("/projects", authorizeFeature("projectAllocation"), createProject);
router.get("/allocations", authorizeFeature("projectAllocation"), listProjectAllocations);
router.post("/allocations", authorizeFeature("projectAllocation"), createProjectAllocation);

router.get("/tasks", authorizeFeature("taskAssignment"), listTasks);
router.post("/tasks", authorizeFeature("taskAssignment"), createTask);
router.put("/tasks/:id", authorizeFeature("taskAssignment"), updateTask);

router.get("/timesheets", authorizeFeature("timesheetEntry"), listTimesheets);
router.post("/timesheets", authorizeFeature("timesheetEntry"), createTimesheet);
router.get("/timesheets/export", authorizeFeature("timesheetEntry"), exportTimesheets);

router.get("/billing", authorizeFeature("projectBilling"), listBillings);
router.post("/billing", authorizeFeature("projectBilling"), createBilling);
router.get("/billing/export", authorizeFeature("projectBilling"), exportBillings);

router.get("/resource-planning", authorizeFeature("resourcePlanning"), listResourcePlans);
router.post("/resource-planning", authorizeFeature("resourcePlanning"), createResourcePlan);

router.get("/milestones", authorizeFeature("milestoneTracking"), listMilestones);
router.post("/milestones", authorizeFeature("milestoneTracking"), createMilestone);
router.put("/milestones/:id", authorizeFeature("milestoneTracking"), updateMilestone);

router.get("/gantt", authorizeFeature("ganttChart"), getGanttData);
router.get("/capacity", authorizeFeature("capacityPlanning"), getCapacityPlanning);
router.get("/capacity/export", authorizeFeature("capacityPlanning"), exportCapacityPlanning);

module.exports = router;
