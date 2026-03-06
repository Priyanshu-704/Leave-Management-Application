const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getJobPostings,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getCandidates,
  createCandidate,
  updateCandidate,
  updateCandidateStage,
  scheduleInterview,
  getInterviews,
  updateInterview,
  generateOfferLetter,
  updateOnboardingChecklist,
  updateDocumentVerification,
  updateBackgroundCheck,
  updateProbation,
  getRecruitmentSummary,
} = require("../controllers/recruitmentController");

const router = express.Router();

router.use(protect);

router.get("/summary", getRecruitmentSummary);

router.route("/jobs").get(getJobPostings).post(authorize("manager", "admin"), createJobPosting);
router
  .route("/jobs/:id")
  .put(authorize("manager", "admin"), updateJobPosting)
  .delete(authorize("manager", "admin"), deleteJobPosting);

router.route("/candidates").get(getCandidates).post(authorize("manager", "admin"), createCandidate);
router.put("/candidates/:id", authorize("manager", "admin"), updateCandidate);
router.put("/candidates/:id/stage", authorize("manager", "admin"), updateCandidateStage);
router.put("/candidates/:id/offer", authorize("manager", "admin"), generateOfferLetter);
router.put("/candidates/:id/onboarding", authorize("manager", "admin"), updateOnboardingChecklist);
router.put(
  "/candidates/:id/document-verification",
  authorize("manager", "admin"),
  updateDocumentVerification,
);
router.put(
  "/candidates/:id/background-check",
  authorize("manager", "admin"),
  updateBackgroundCheck,
);
router.put("/candidates/:id/probation", authorize("manager", "admin"), updateProbation);

router.route("/interviews").get(getInterviews).post(authorize("manager", "admin"), scheduleInterview);
router.put("/interviews/:id", authorize("manager", "admin"), updateInterview);

module.exports = router;
