const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  leavePrediction,
  attendanceAnomalyDetection,
  employeeChurnPrediction,
  smartScheduling,
  chatbotQuery,
  resumeParsing,
  sentimentAnalysis,
  performancePrediction,
} = require("../controllers/aiController");

const router = express.Router();

router.use(protect);

router.post("/chatbot", chatbotQuery);
router.post("/sentiment-analysis", sentimentAnalysis);

router.post("/leave-prediction", authorize("manager", "admin"), leavePrediction);
router.get(
  "/attendance-anomaly-detection",
  authorize("manager", "admin"),
  attendanceAnomalyDetection,
);
router.get(
  "/employee-churn-prediction",
  authorize("manager", "admin"),
  employeeChurnPrediction,
);
router.post("/smart-scheduling", authorize("manager", "admin"), smartScheduling);
router.post("/resume-parsing", authorize("manager", "admin"), resumeParsing);
router.get(
  "/performance-prediction",
  authorize("manager", "admin"),
  performancePrediction,
);

module.exports = router;
