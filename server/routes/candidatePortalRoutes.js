const express = require("express");
const { protectCandidate } = require("../middleware/candidateAuth");
const {
  registerCandidate,
  loginCandidate,
  getCandidateMe,
  updateCandidateProfile,
  getPublicJobs,
  applyForJob,
  getMyApplications,
  getCandidateDashboard,
} = require("../controllers/candidatePortalController");

const router = express.Router();

router.post("/register", registerCandidate);
router.post("/login", loginCandidate);
router.get("/jobs", getPublicJobs);

router.use(protectCandidate);

router.get("/me", getCandidateMe);
router.put("/me", updateCandidateProfile);
router.get("/dashboard", getCandidateDashboard);
router.get("/applications", getMyApplications);
router.post("/apply", applyForJob);

module.exports = router;
