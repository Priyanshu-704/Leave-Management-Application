const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getNominations,
  createNomination,
  updateNominationStatus,
  getTrainingCalendar,
  createTrainingCalendarEvent,
  updateTrainingCalendarEvent,
  deleteTrainingCalendarEvent,
  getCertifications,
  createCertification,
  updateCertification,
  submitTrainingFeedback,
  getTrainingFeedback,
  submitAssessment,
  getLearningPaths,
  createLearningPath,
  updateLearningPath,
  enrollInLearningPath,
  getLearningSummary,
} = require("../controllers/learningController");

const router = express.Router();

router.use(protect);

router.get("/summary", getLearningSummary);

router.route("/courses").get(getCourses).post(authorize("manager", "admin"), createCourse);
router
  .route("/courses/:id")
  .put(authorize("manager", "admin"), updateCourse)
  .delete(authorize("manager", "admin"), deleteCourse);

router.route("/nominations").get(getNominations).post(authorize("manager", "admin"), createNomination);
router.put("/nominations/:id/status", updateNominationStatus);

router.route("/calendar").get(getTrainingCalendar).post(authorize("manager", "admin"), createTrainingCalendarEvent);
router
  .route("/calendar/:id")
  .put(authorize("manager", "admin"), updateTrainingCalendarEvent)
  .delete(authorize("manager", "admin"), deleteTrainingCalendarEvent);

router.route("/certifications").get(getCertifications).post(authorize("manager", "admin"), createCertification);
router.put("/certifications/:id", authorize("manager", "admin"), updateCertification);

router.route("/feedback").get(getTrainingFeedback).post(submitTrainingFeedback);
router.post("/assessments", submitAssessment);

router.route("/paths").get(getLearningPaths).post(authorize("manager", "admin"), createLearningPath);
router.put("/paths/:id", authorize("manager", "admin"), updateLearningPath);
router.post("/paths/:id/enroll", enrollInLearningPath);

module.exports = router;
