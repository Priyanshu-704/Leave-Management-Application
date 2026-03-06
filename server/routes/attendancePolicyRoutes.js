const express = require("express");
const { protect, authorizeFeature } = require("../middleware/auth");
const { getAttendancePolicy, updateAttendancePolicy, validateGeoFenceForCheckIn } = require("../controllers/workforce/attendancePolicyController");

const router = express.Router();

router.use(protect);

router.get("/", authorizeFeature("geofencedCheckIn"), getAttendancePolicy);
router.put("/", authorizeFeature("checkInControl"), updateAttendancePolicy);
router.post("/geofence/validate", authorizeFeature("geofencedCheckIn"), validateGeoFenceForCheckIn);

module.exports = router;
